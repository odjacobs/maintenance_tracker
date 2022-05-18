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
    /// Container for basic runtime data.
    app_title: Option<String>,
    app_version: Option<String>,
    config: structs::Config,
    db_credentials: structs::DbCredentials,
    tera: Tera,
}

impl State {
    fn new(
        tera_instance: Tera,
        config: structs::Config,
        credentials: structs::DbCredentials,
    ) -> Self {
        State {
            app_title: None,
            app_version: None,
            config: config,
            db_credentials: credentials,
            tera: tera_instance,
        }
    }
}

fn read_json<T>(filepath: &Path) -> T
where
    T: serde::Serialize,
    T: serde::de::DeserializeOwned,
{
    serde_json::from_str::<T>(&std::fs::read_to_string(filepath).unwrap()).unwrap()
}

fn write_json<T>(object: &T, filename: &str)
where
    T: serde::Serialize,
{
    std::fs::write(
        format!("{}", filename),
        serde_json::to_string_pretty(object).unwrap(),
    )
    .unwrap();
}

#[async_std::main]
async fn main() -> Result<()> {
    dotenv().ok();
    tide::log::start();

    let config_filepath = Path::new(constants::CONFIG_FILE);
    let credentials_filepath = Path::new(constants::CREDENTIALS_FILE);

    let save = args().last() == Some("-s".to_owned());
    let other = args().last() == Some("-o".to_owned());

    let mut conn: PooledConn;
    let mut conn_string: String = String::new();
    let mut config: structs::Config;
    let mut credentials: structs::DbCredentials;

    if config_filepath.exists() {
        // if a config file exists, read it
        config = read_json::<structs::Config>(&config_filepath);
    } else {
        // write a config file if one doesn't exist
        config = structs::Config::from_prompt();

        write_json(&config, constants::CONFIG_FILE);
    }

    if credentials_filepath.exists() && !save && !other {
        // if credentials file exists and no flags are passed
        credentials = read_json::<structs::DbCredentials>(&credentials_filepath);

        match database::test_auth(&credentials) {
            Ok(_) => {}
            Err(e) => {
                println!("{}", constants::SAVED_CREDENTIALS_INVALID_MSG);
                panic!();
            }
        }
    } else if save {
        // if `-s` flag is passed, overwrite existing configuration & credentials
        loop {
            config = structs::Config::from_prompt();
            credentials = structs::DbCredentials::from_prompt();

            match database::test_auth(&credentials) {
                Ok(_) => break,
                Err(_) => {
                    println!("{}", constants::CREDENTIALS_INVALID_MSG);
                    continue;
                }
            }
        }

        write_json(&config, constants::CONFIG_FILE);
        write_json(&credentials, constants::CREDENTIALS_FILE);
    } else {
        // if `-o` flag is passed, get other configuration settings
        loop {
            config = structs::Config::from_prompt();
            credentials = structs::DbCredentials::from_prompt();

            match database::test_auth(&credentials) {
                Ok(_) => break,
                Err(_) => {
                    println!("{}", constants::CREDENTIALS_INVALID_MSG);
                    continue;
                }
            }
        }
    }

    conn = database::connect(&credentials).unwrap();

    // get a clone of config.port for use in launching the application
    let port = config.port.clone();

    // we're using tera for templating
    let mut tera = Tera::new("templates/**/*").expect("Error parsing templates directory.");
    tera.autoescape_on(vec!["html"]);

    let mut state = State::new(tera, config, credentials);
    let mut app = tide::with_state(state);

    // get existing database items
    let mut items = database::collect_items(&mut conn);

    app.at("/static").serve_dir("./static").unwrap();

    // index page
    app.at("/")
        .get(|req: tide::Request<State>| async move {
            /// Get information from the database.
            let tera = req.state().tera.clone();
            let mut c = database::connect(&req.state().db_credentials).unwrap();

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
                database::update_item(
                    &mut database::connect(&req.state().db_credentials).unwrap(),
                    &item,
                )?;
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
                &mut database::connect(&req.state().db_credentials).unwrap(),
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
    app.listen(format!("0.0.0.0:{}", port)).await?;

    Ok(())
}
