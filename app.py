import streamlit as st
import streamlit.components.v1 as components
import os
import re

# 1. Page Configuration
st.set_page_config(
    page_title="ArenaFlow 2026 - Stadium Visualizer & Ops Hub",
    page_icon="🏟️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. Premium Hackathon Presentation Overlay
# Hides Streamlit's default headers, main menu dropdown, and page borders 
# so that the custom Web visualizer displays fullscreen with zero clutter.
st.markdown("""
    <style>
        /* Hide default Streamlit headers and footers to reclaim space */
        #MainMenu {display: none !important;}
        footer {display: none !important;}
        header {display: none !important;}
        
        .block-container {
            padding-top: 0rem !important;
            padding-bottom: 0rem !important;
            padding-left: 0rem !important;
            padding-right: 0rem !important;
        }
        
        /* Force the component iframe to occupy exactly the viewport height */
        iframe {
            height: calc(100vh - 40px) !important;
            width: 100% !important;
            border: none !important;
            display: block;
        }
    </style>
""", unsafe_allow_html=True)

# 3. Path Configuration
current_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(current_dir, "dist")
index_path = os.path.join(dist_dir, "index.html")

# 4. Read Build & Dynamically Inline Asset Codes
# Streamlit component iframes struggle with relative asset urls (like "/assets/index.js").
# Inlining CSS/JS directly solves local path errors and makes the site 100% self-contained.
if os.path.exists(index_path):
    with open(index_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Locate the assets directory containing Vite compiled bundles
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        for filename in os.listdir(assets_dir):
            filepath = os.path.join(assets_dir, filename)
            
            if filename.endswith(".css"):
                with open(filepath, "r", encoding="utf-8") as cf:
                    css_content = cf.read()
                # Swap link tag with style block
                pattern = rf'<link[^>]*href="[^"]*{filename}"[^>]*>'
                html_content = re.sub(pattern, lambda m: f"<style>{css_content}</style>", html_content)
                
            elif filename.endswith(".js"):
                with open(filepath, "r", encoding="utf-8") as jf:
                    js_content = jf.read()
                # Swap script tag with module block
                pattern = rf'<script[^>]*src="[^"]*{filename}"[^>]*></script>'
                html_content = re.sub(pattern, lambda m: f"<script type=\"module\">{js_content}</script>", html_content)

    # 5. Render Fullscreen HTML Frame
    # Height can be configured below. 950px fits most standard displays perfectly.
    components.html(html_content, height=950, scrolling=True)
else:
    st.error("Build files not found. Please compile the project first by running: `npm run build` in your terminal.")
