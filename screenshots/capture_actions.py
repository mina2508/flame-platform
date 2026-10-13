# -*- coding: utf-8 -*-
"""Capture ACTION-level screenshots for a non-technical walkthrough deck."""
import os
from playwright.sync_api import sync_playwright

OUT = os.path.dirname(os.path.abspath(__file__))
BASE = "http://localhost:5173"
ADMIN_EMAIL = "admin@flame.org"
ADMIN_PASS = "Flame@Admin2026"

def shot(page, name, full=True):
    page.screenshot(path=os.path.join(OUT, name), full_page=full)
    print("captured", name)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1366, "height": 900})

    # A1 — Home
    pg.goto(BASE + "/", wait_until="networkidle"); pg.wait_for_timeout(1500)
    shot(pg, "a01_home.png")

    # A2 — Apply popup open (click an Apply button)
    try:
        pg.click("text=Apply", timeout=5000)
        pg.wait_for_timeout(900)
        shot(pg, "a02_apply_form.png", full=False)
    except Exception as e:
        print("skip apply", e)

    # A3 — Dashboard overview
    pg.goto(BASE + "/dashboard", wait_until="networkidle"); pg.wait_for_timeout(2000)
    shot(pg, "a03_dashboard.png")

    # A4 — Dashboard date picker open
    try:
        pg.click("text=FROM", timeout=3000)
        pg.wait_for_timeout(500)
        pg.click("button:has-text('📅')", timeout=3000)
        pg.wait_for_timeout(700)
        shot(pg, "a04_datepicker.png", full=False)
    except Exception as e:
        print("skip datepicker", e)

    # A5 — Missions public
    pg.goto(BASE + "/missions", wait_until="networkidle"); pg.wait_for_timeout(1200)
    shot(pg, "a05_missions.png")

    # A6 — Map with pins
    pg.goto(BASE + "/map", wait_until="networkidle"); pg.wait_for_timeout(2200)
    shot(pg, "a06_map.png")

    # A7 — Birthdays
    pg.goto(BASE + "/birthdays", wait_until="networkidle"); pg.wait_for_timeout(1200)
    shot(pg, "a07_birthdays.png")

    # A8 — Curriculum library
    pg.goto(BASE + "/curriculum", wait_until="networkidle"); pg.wait_for_timeout(1200)
    shot(pg, "a08_curriculum.png")

    # --- Admin ---
    pg.goto(BASE + "/login", wait_until="networkidle")
    shot(pg, "a09_login.png", full=False)
    pg.fill("input[placeholder='Email']", ADMIN_EMAIL)
    pg.fill("input[placeholder='Password']", ADMIN_PASS)
    pg.click("button:has-text('Login')")
    pg.wait_for_timeout(1800)
    shot(pg, "a10_admin_home.png")

    # A11 — Missions admin (create form visible)
    try:
        pg.click("button:has-text('Missions')", timeout=4000); pg.wait_for_timeout(1200)
        shot(pg, "a11_admin_missions.png")
    except Exception as e: print("skip missions", e)

    # A12 — Database → expand a school (task board + people)
    try:
        pg.click("button:has-text('Database')", timeout=4000); pg.wait_for_timeout(800)
        pg.click("text=Schools", timeout=4000); pg.wait_for_timeout(900)
        shot(pg, "a12_admin_schools.png")
    except Exception as e: print("skip schools", e)

    # A13 — Application Form builder
    try:
        pg.click("button:has-text('Application Form')", timeout=4000); pg.wait_for_timeout(1000)
        shot(pg, "a13_admin_formbuilder.png")
    except Exception as e: print("skip form", e)

    # A14 — Users
    try:
        pg.click("button:has-text('Users')", timeout=4000); pg.wait_for_timeout(900)
        shot(pg, "a14_admin_users.png")
    except Exception as e: print("skip users", e)

    b.close()
print("Action screenshots done.")
