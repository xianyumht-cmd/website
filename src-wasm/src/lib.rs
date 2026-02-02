use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct NavItem {
    pub title: String,
    pub description: String,
    pub url: String,
    pub icon: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct NavSection {
    pub id: String,
    pub icon: String,
    pub title: String,
    pub items: Vec<NavItem>,
}

#[wasm_bindgen]
pub fn generate_menu_html(data_json: &str) -> String {
    let sections: Vec<NavSection> = match serde_json::from_str(data_json) {
        Ok(v) => v,
        Err(e) => return format!("<!-- Error parsing data: {} -->", e),
    };

    let mut html = String::new();
    for section in sections {
        html.push_str(&format!(
            "<li><a class=\"smooth\" href=\"#{}\"><i class=\"{}\"></i><span class=\"title\">{}</span></a></li>",
            section.id, section.icon, section.title
        ));
    }
    html
}

#[wasm_bindgen]
pub fn validate_license(key: &str) -> bool {
    key == "secret-license-key"
}
