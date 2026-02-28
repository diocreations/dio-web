from fastapi import APIRouter, Depends
from database import db
from helpers import get_current_user
import uuid

router = APIRouter(prefix="/api")


# ---- Public endpoints ----

@router.get("/menus/nav")
async def get_nav_menu():
    """Get active navigation menu items"""
    items = await db.menus.find(
        {"menu_type": "nav", "is_active": True}, {"_id": 0}
    ).sort("order", 1).to_list(50)
    if not items:
        return _default_nav()
    return _build_tree(items)


@router.get("/menus/footer")
async def get_footer_menu():
    """Get active footer menu items"""
    items = await db.menus.find(
        {"menu_type": "footer", "is_active": True}, {"_id": 0}
    ).sort("order", 1).to_list(50)
    if not items:
        return _default_footer()
    return _build_tree(items)


# ---- Admin endpoints ----

@router.get("/admin/menus")
async def get_all_menus(user: dict = Depends(get_current_user)):
    items = await db.menus.find({}, {"_id": 0}).sort([("menu_type", 1), ("order", 1)]).to_list(200)
    # If no menus exist, seed the defaults so admin can edit them
    if not items:
        await _seed_default_menus()
        items = await db.menus.find({}, {"_id": 0}).sort([("menu_type", 1), ("order", 1)]).to_list(200)
    return items


async def _seed_default_menus():
    """Seed default nav and footer menus if database is empty"""
    nav_items = [
        {"item_id": f"menu_nav_{i}", "menu_type": "nav", "label": label, "path": path, "order": i, "is_active": True, "parent_id": None}
        for i, (label, path) in enumerate([
            ("Home", "/"),
            ("About", "/about"),
            ("Services", "/services"),
            ("Products", "/products"),
            ("Resume AI", "/resume-optimizer"),
            ("Portfolio", "/portfolio"),
            ("Blog", "/blog"),
            ("Contact", "/contact"),
        ])
    ]
    footer_items = [
        {"item_id": f"menu_footer_{i}", "menu_type": "footer", "label": label, "path": path, "order": i, "is_active": True, "parent_id": None}
        for i, (label, path) in enumerate([
            ("Home", "/"),
            ("About", "/about"),
            ("Services", "/services"),
            ("Products", "/products"),
            ("Portfolio", "/portfolio"),
            ("Blog", "/blog"),
            ("Contact", "/contact"),
        ])
    ]
    await db.menus.insert_many(nav_items + footer_items)


@router.post("/admin/menus/seed-defaults")
async def seed_default_menus_endpoint(user: dict = Depends(get_current_user)):
    """Manually seed default menus - clears existing and adds defaults"""
    # Clear existing menus
    await db.menus.delete_many({})
    # Seed defaults
    await _seed_default_menus()
    # Return the new menus
    items = await db.menus.find({}, {"_id": 0}).sort([("menu_type", 1), ("order", 1)]).to_list(200)
    return {"message": "Default menus loaded", "count": len(items)}


@router.post("/admin/menus")
async def create_menu_item(data: dict, user: dict = Depends(get_current_user)):
    item = {
        "item_id": f"menu_{uuid.uuid4().hex[:12]}",
        "menu_type": data.get("menu_type", "nav"),
        "label": data.get("label", ""),
        "path": data.get("path", "/"),
        "order": data.get("order", 0),
        "parent_id": data.get("parent_id"),
        "is_active": data.get("is_active", True),
        "open_new_tab": data.get("open_new_tab", False),
    }
    await db.menus.insert_one(item)
    item.pop("_id", None)
    return item


@router.put("/admin/menus/{item_id}")
async def update_menu_item(item_id: str, data: dict, user: dict = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("item_id", None)
    await db.menus.update_one({"item_id": item_id}, {"$set": data})
    return await db.menus.find_one({"item_id": item_id}, {"_id": 0})


@router.put("/admin/menus/reorder")
async def reorder_menus(data: dict, user: dict = Depends(get_current_user)):
    items = data.get("items", [])
    for i, item_id in enumerate(items):
        await db.menus.update_one({"item_id": item_id}, {"$set": {"order": i}})
    return {"message": "Reordered"}


@router.delete("/admin/menus/{item_id}")
async def delete_menu_item(item_id: str, user: dict = Depends(get_current_user)):
    await db.menus.delete_one({"item_id": item_id})
    # Also delete children
    await db.menus.delete_many({"parent_id": item_id})
    return {"message": "Deleted"}


# ---- Helpers ----

def _build_tree(items):
    """Build a nested tree from flat list using parent_id"""
    by_id = {it["item_id"]: {**it, "children": []} for it in items}
    roots = []
    for it in items:
        node = by_id[it["item_id"]]
        pid = it.get("parent_id")
        if pid and pid in by_id:
            by_id[pid]["children"].append(node)
        else:
            roots.append(node)
    return roots


def _default_nav():
    return [
        {"item_id": "d_home", "label": "Home", "path": "/", "children": []},
        {"item_id": "d_about", "label": "About", "path": "/about", "children": []},
        {"item_id": "d_services", "label": "Services", "path": "/services", "children": []},
        {"item_id": "d_products", "label": "Products", "path": "/products", "children": []},
        {"item_id": "d_resume", "label": "Resume AI", "path": "/resume-optimizer", "children": []},
        {"item_id": "d_portfolio", "label": "Portfolio", "path": "/portfolio", "children": []},
        {"item_id": "d_blog", "label": "Blog", "path": "/blog", "children": []},
        {"item_id": "d_contact", "label": "Contact", "path": "/contact", "children": []},
    ]


def _default_footer():
    return [
        {"item_id": "f_home", "label": "Home", "path": "/", "children": []},
        {"item_id": "f_about", "label": "About", "path": "/about", "children": []},
        {"item_id": "f_services", "label": "Services", "path": "/services", "children": []},
        {"item_id": "f_products", "label": "Products", "path": "/products", "children": []},
        {"item_id": "f_portfolio", "label": "Portfolio", "path": "/portfolio", "children": []},
        {"item_id": "f_blog", "label": "Blog", "path": "/blog", "children": []},
        {"item_id": "f_contact", "label": "Contact", "path": "/contact", "children": []},
    ]
