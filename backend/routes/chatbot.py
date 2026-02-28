"""Chatbot, leads, and chat session routes"""
from fastapi import APIRouter, HTTPException
from database import db, EMERGENT_LLM_KEY, logger
from helpers import get_current_user
from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import Depends
from datetime import datetime, timezone
import re
import random

router = APIRouter(prefix="/api")

DEFAULT_GREETINGS = [
    "Hey there! I'm Dio, your digital guide at DioCreations. What are you working on today?",
    "Welcome! I'm Dio \u2014 think of me as your tech-savvy friend. What can I help you with?",
    "Hi! Dio here, ready to chat. Whether it's websites, apps, or AI \u2014 I've got you covered.",
    "Hello! I'm Dio from DioCreations. Need a website, SEO boost, or just curious? Let's talk!",
    "Hey! Dio at your service. I know a thing or two about the digital world. What brings you here?",
    "Welcome to DioCreations! I'm Dio, your friendly AI assistant. Ask me anything!",
    "Hi there! I'm Dio, and I love helping people figure out their digital needs.",
    "Greetings! I'm Dio \u2014 part AI, part digital enthusiast, fully here to help.",
]

chat_instances = {}
_cached_system_message = None


async def get_chatbot_settings():
    settings = await db.chatbot_settings.find_one({"settings_id": "chatbot"}, {"_id": 0})
    if not settings:
        settings = {"settings_id": "chatbot", "greetings": DEFAULT_GREETINGS, "knowledge_base": [], "personality": ""}
    return settings


async def build_system_message():
    global _cached_system_message
    if _cached_system_message:
        return _cached_system_message
    settings = await get_chatbot_settings()
    knowledge_entries = settings.get("knowledge_base", [])
    custom_personality = settings.get("personality", "")
    kb_text = ""
    if knowledge_entries:
        kb_text = "\n\nKNOWLEDGE BASE:\n"
        for entry in knowledge_entries:
            if entry.get("enabled", True):
                kb_text += f"[{entry.get('title', 'Info')}] {entry.get('content', '')}\n"
    personality_text = f"\n\nEXTRA CONTEXT: {custom_personality}\n" if custom_personality.strip() else ""
    msg = f"""You are Dio, a sharp and friendly AI assistant for DioCreations. You're knowledgeable about everything but specialize in digital solutions.

RULES:
- Keep replies SHORT (2-4 sentences max). Be punchy and conversational.
- Sound like a smart friend texting, not a corporate chatbot.
- Ask ONE follow-up question to keep the conversation going.
- Use the visitor's name after they share it.
- Answer ANY question helpfully. When relevant, casually mention DioCreations services.

SERVICES (mention naturally when relevant):
Web Dev: /services/web-development | Mobile Apps: /services/mobile-app-development | SEO: /services/seo-services | AI Solutions: /services/ai-solutions | Products: /products | Portfolio: /portfolio | Contact: /contact

LEAD CAPTURE:
1. Ask for NAME: "By the way, what should I call you?"
2. Then EMAIL: "Great, [name]! What's the best email to reach you at?"
3. Then PHONE: "And a phone or WhatsApp number?"
Format: [LEAD_INFO:name=X,email=Y,phone=Z]
PORTFOLIO: [SHOW_PORTFOLIO:category] when relevant
QUICK REPLIES: [QUICK_REPLIES:option1|option2|option3]
{kb_text}{personality_text}"""
    _cached_system_message = msg
    return msg


def parse_lead_info(text):
    match = re.search(r'\[LEAD_INFO:([^\]]+)\]', text)
    if match:
        return {k.strip(): v.strip() for k, v in (pair.split("=", 1) for pair in match.group(1).split(",") if "=" in pair)}
    return None


def parse_portfolio_request(text):
    match = re.search(r'\[SHOW_PORTFOLIO:([^\]]+)\]', text)
    return match.group(1).strip() if match else None


def parse_quick_replies(text):
    match = re.search(r'\[QUICK_REPLIES:([^\]]+)\]', text)
    return [r.strip() for r in match.group(1).split("|") if r.strip()][:3] if match else None


def clean_response(text):
    cleaned = re.sub(r'\[LEAD_INFO:[^\]]+\]', '', text)
    cleaned = re.sub(r'\[SHOW_PORTFOLIO:[^\]]+\]', '', cleaned)
    cleaned = re.sub(r'\[QUICK_REPLIES:[^\]]+\]', '', cleaned)
    return cleaned.strip()


@router.get("/chatbot/greeting")
async def get_random_greeting():
    settings = await get_chatbot_settings()
    greetings = [g for g in settings.get("greetings", DEFAULT_GREETINGS) if g.strip()]
    return {"greeting": random.choice(greetings or DEFAULT_GREETINGS)}


@router.get("/chatbot/settings")
async def get_chatbot_settings_admin(user: dict = Depends(get_current_user)):
    return await get_chatbot_settings()


@router.put("/chatbot/settings")
async def update_chatbot_settings(update: dict, user: dict = Depends(get_current_user)):
    global _cached_system_message
    update["settings_id"] = "chatbot"
    update.pop("_id", None)
    await db.chatbot_settings.update_one({"settings_id": "chatbot"}, {"$set": update}, upsert=True)
    _cached_system_message = None
    chat_instances.clear()
    return await db.chatbot_settings.find_one({"settings_id": "chatbot"}, {"_id": 0})


@router.post("/chat")
async def chat_with_dio(data: dict):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Chat service not configured")
    session_id = data.get("session_id", "")
    message = data.get("message", "")
    if session_id not in chat_instances:
        system_msg = await build_system_message()
        chat_instances[session_id] = {
            "chat": LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system_msg).with_model("gemini", "gemini-2.0-flash"),
            "history": [],
            "lead_info": {},
            "created_at": datetime.now(timezone.utc),
        }
    chat_data = chat_instances[session_id]
    chat = chat_data["chat"]
    chat_data["history"].append({"role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()})
    try:
        response = await chat.send_message(UserMessage(text=message))
        lead_info = parse_lead_info(response)
        show_portfolio = parse_portfolio_request(response)
        quick_replies = parse_quick_replies(response)
        cleaned_response = clean_response(response)
        chat_data["history"].append({"role": "assistant", "content": cleaned_response, "timestamp": datetime.now(timezone.utc).isoformat()})
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"session_id": session_id, "history": chat_data["history"], "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        if lead_info:
            chat_data["lead_info"].update(lead_info)
            existing_lead = await db.leads.find_one({"session_id": session_id})
            if existing_lead:
                await db.leads.update_one({"session_id": session_id}, {"$set": {**lead_info, "updated_at": datetime.now(timezone.utc).isoformat()}})
            else:
                lead_id = f"lead_{__import__('uuid').uuid4().hex[:12]}"
                await db.leads.insert_one({"lead_id": lead_id, "session_id": session_id, **lead_info, "source": "chatbot", "status": "new", "created_at": datetime.now(timezone.utc).isoformat()})
        return {
            "response": cleaned_response,
            "session_id": session_id,
            "lead_info": chat_data.get("lead_info") or None,
            "show_portfolio": show_portfolio,
            "quick_replies": quick_replies,
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from Dio")


@router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    if session_id in chat_instances:
        return {"history": chat_instances[session_id]["history"], "lead_info": chat_instances[session_id].get("lead_info", {})}
    session = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    lead = await db.leads.find_one({"session_id": session_id}, {"_id": 0})
    return {"history": session.get("history", []) if session else [], "lead_info": lead if lead else {}}


@router.delete("/chat/{session_id}")
async def clear_chat_session(session_id: str):
    if session_id in chat_instances:
        del chat_instances[session_id]
    await db.chat_sessions.delete_one({"session_id": session_id})
    return {"message": "Chat session cleared"}


# ==================== LEADS ====================

@router.get("/leads")
async def get_leads(user: dict = Depends(get_current_user)):
    return await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("lead_id", None)
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.leads.update_one({"lead_id": lead_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({"lead_id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}


@router.post("/chat/schedule")
async def schedule_call(data: dict):
    """Save scheduled date/time for a chat session lead"""
    session_id = data.get("session_id", "")
    scheduled_date = data.get("scheduled_date", "")
    
    if not session_id or not scheduled_date:
        raise HTTPException(status_code=400, detail="session_id and scheduled_date required")
    
    # Update the lead with scheduled date
    await db.leads.update_one(
        {"session_id": session_id},
        {"$set": {"scheduled_date": scheduled_date, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Also store in chat session for context
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"scheduled_date": scheduled_date}},
        upsert=True
    )
    
    return {"success": True, "scheduled_date": scheduled_date}


@router.get("/chat/{session_id}/admin-history")
async def get_admin_chat_history(session_id: str, user: dict = Depends(get_current_user)):
    """Get full chat history for a session (admin only)"""
    session = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        return {"history": []}
    return {"history": session.get("messages", []), "scheduled_date": session.get("scheduled_date")}

