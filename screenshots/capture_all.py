# -*- coding: utf-8 -*-
"""Capture fresh screenshots of the running FLAME app (public + admin)."""
import os
from playwright.sync_api import sync_playwright

OUT = os.path.dirname(os.path.abspath(__file__))
BASE = "http://localhost:5173"
ADMIN_EMAIL = "admin@flame.org"
ADMIN_PASS = "Flame@Admin2026"

PUBLIC_PAGES = [
    ("/", "01_home.png", 1200),
    ("/dashboard", "02_dashboard.png", 2000),
    ("/missions", "03_missions.png", 1200),
    ("/activities", "04_activities.png", 1200),
    ("/news", "05_news.png", 1200),
    ("/curriculum", "06_curriculum.png", 1200),
    ("/birthdays", "07_birthdays.png", 1200),
    ("/map", "08_map.png", 2000),
]

def shot(page, name, full=True):
    page.screenshot(path=os.path.join(OUT, name), full_page=full)
    print("captured", name)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1366, "height": 900})

    for path, name, wait in PUBLIC_PAGES:
        try:
            page.goto(BASE + path, wait_until="networkidle", timeout=40000)
            if wait: page.wait_for_timeout(wait)
            shot(page, name)
        except Exception as e:
            print("skip", name, e)

    # Admin login
    page.goto(BASE + "/login", wait_until="networkidle")
    shot(page, "09_admin_login.png", full=False)
    page.fill("input[placeholder='Email']", ADMIN_EMAIL)
    page.fill("input[placeholder='Password']", ADMIN_PASS)
    page.click("button:has-text('Login')")
    page.wait_for_timeout(2000)
    shot(page, "10_admin_dashboard.png")

    # Admin tabs — click each top-level tab if present
    tabs = [
        ("Database", "11_admin_database.png"),
        ("Missions", "12_admin_missions.png"),
        ("News & Activities", "13_admin_news.png"),
        ("Users", "14_admin_users.png"),
        ("Application Form", "15_admin_formbuilder.png"),
        ("Applications", "16_admin_applications.png"),
    ]
    for label, name in tabs:
        try:
            page.click(f"button:has-text('{label}')", timeout=4000)
            page.wait_for_timeout(1200)
            shot(page, name)
        except Exception as e:
            print("skip tab", label, e)

    # Expand a school in Database to show the task board / people & roles
    try:
        page.click("button:has-text('Database')", timeout=4000)
        page.wait_for_timeout(800)
        page.click("text=Schools", timeout=4000)
        page.wait_for_timeout(1000)
        shot(page, "17_admin_schools.png")
    except Exception as e:
        print("skip schools expand", e)

    browser.close()
print("All screenshots captured.")
