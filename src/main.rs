#![allow(unused)]

use std::collections::BTreeMap;
use std::env::{args, var};
use std::io;
use std::path::Path;

use dotenv::dotenv;
use mysql::{prelude::*, *};
use rpassword::read_password;
use tera::Tera;
use tide_tera::prelude::*;

mod core;
mod data;
mod db;

use crate::core::{functions, structs};
use data::*;
use db::database;

#[derive(Clone, Debug)]
struct State {
    /// Container for simple runtime data.
    app_title: Option<String>,
    app_version: Option<String>,
    db_credentials: structs::DbCredentials,
    tera: Tera,
}

impl State {
    fn new(tera_instance: Tera, credentials: structs::DbCredentials) -> Self {
        State {
            app_title: None,
            app_version: None,
            db_credentials: credentials,
            tera: tera_instance,
        }
    }
}

fn get_conn(credentials: &structs::DbCredentials) -> Result<PooledConn> {
    /// Establish a database connection from environment variables.
    match database::connect(credentials) {
        Ok(conn) => Ok(conn),
        Err(e) => Err(e),
    }
}

#[async_std::main]
async fn main() -> Result<()> {
    dotenv().ok();
    tide::log::start();

    let credentials_filepath = Path::new(constants::CREDENTIALS_FILE);

    let save = args().last() == Some("-s".to_owned());

    let mut conn: PooledConn;
    let mut conn_string: String = String::new();
    let mut credentials: structs::DbCredentials;

    // let json_string = std::fs::read_to_string(credentials_filepath).unwrap();
    // credentials = serde_json::from_str::<structs::DbCredentials>(json_string.clone()).unwrap();

    if credentials_filepath.exists() && !save {
        credentials = serde_json::from_str::<structs::DbCredentials>(
            &std::fs::read_to_string(credentials_filepath).unwrap(),
        )
        .unwrap();
    } else if save {
        credentials = structs::DbCredentials::from_prompt();

        // store credentials in JSON file
        std::fs::write(
            format!("{}", constants::CREDENTIALS_FILE),
            serde_json::to_string_pretty(&credentials).unwrap(),
        )
        .unwrap();
    } else {
        credentials = structs::DbCredentials::from_prompt();
    }

    conn = database::connect(&credentials).unwrap();

    // we're using tera for templating
    let mut tera = Tera::new("templates/**/*").expect("Error parsing templates directory.");
    tera.autoescape_on(vec!["html"]);

    let mut state = State::new(tera, credentials);
    let mut app = tide::with_state(state);

    // get existing database items
    let mut items = database::collect_items(&mut conn);

    app.at("/static").serve_dir("./static").unwrap();

    // index page
    app.at("/")
        .get(|req: tide::Request<State>| async move {
            /// Get information from the database.
            let tera = req.state().tera.clone();
            let mut c = get_conn(&req.state().db_credentials).unwrap();

            tera.render_response(
                "index.html",
                &context! {
                    "app_title" => constants::APP_TITLE.to_owned(),
                    "app_version" => constants::APP_VERSION.to_owned(),
                    "categories" => database::collect_categories(&mut c),
                    "items" => database::collect_items(&mut c),
                },
            )
        })
        .post(|mut req: tide::Request<State>| async move {
            /// Update information in the database.
            let req_string = req.body_string().await?;
            let items = functions::parse_json_string(req_string);

            for (id, item) in items {
                database::update_item(&mut get_conn(&req.state().db_credentials).unwrap(), &item)?;
            }

            Ok("OK")
        });

    // ajax history
    app.at("history/:id")
        .get(|mut req: tide::Request<State>| async move {
            // get item id from URL
            let id = req.param("id").unwrap();

            // get all entries with matching id
            let mut entries = database::collect_item_entries(
                &mut get_conn(&req.state().db_credentials).unwrap(),
                &id,
            );

            // build HTML response
            let mut html_str = String::from("");
            for entry in entries {
                html_str.push_str(&format!(
                    "
                    <div class=\"entry\">
                        <p>{}</p>
                        <p>{}</p>
                        <p>{}</p>
                        <p class=\"note\">{}</p>
                    </div>
                    ",
                    entry.date.unwrap(),
                    entry.status.unwrap_or(0),
                    entry.cost.unwrap_or(0),
                    entry.note.unwrap_or("No Description.".to_string())
                ));
            }

            Ok(html_str)
        });

    // run the application
    app.listen("127.0.0.1:8000").await?;

    Ok(())
}
