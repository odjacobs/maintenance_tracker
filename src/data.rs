#![allow(unused)]

pub mod constants {
    pub const APP_TITLE: &str = "Maintenance Tracker";
    pub const APP_VERSION: &str = "0.1.0";
}

pub mod local {
    /// Client-specific information used to
    /// run the initial setup process.
    use std::collections::HashMap;

    // query that creates database tables
    pub const CREATE_TABLES_QUERY: &str = r"
        CREATE TABLE IF NOT EXISTS Category (
            id INT(6) NOT NULL AUTO_INCREMENT,
            title VARCHAR(30) NOT NULL,
            PRIMARY KEY (id)
        );

        CREATE TABLE IF NOT EXISTS Item (
            id INT(8) NOT NULL AUTO_INCREMENT,
            title VARCHAR(30) NOT NULL,
            category_id INT NOT NULL REFERENCES Category(id),
            cost INT,
            note TEXT,
            status TINYINT,
            statdesc VARCHAR(255),
            visible BOOL,
            PRIMARY KEY (id)
        );
        ";

    pub fn categories() -> Vec<&'static str> {
        /// Returns collection of category titles
        vec![
            "2-AXIS LATHE",
            "3-AXIS MILL",
            "5-AXIS MILL (HORIZONTAL)",
            "5-AXIS MILL (HYBRID)",
            "5-AXIS MILL (VERTICAL)",
            "AC UNIT",
            "AIR COMPRESSOR",
            "BRIDGEPORT LATHE",
            "EDM",
            "FORKLIFT",
            "GRINDER",
            "HARDINGE CHUCKER",
            "HONE",
            "MEDIA BLAST",
            "NT",
            "OGP",
            "OKUMA",
            "PAINT/BLUECOAT",
            "PERSONNEL LIFT",
            "SAW",
            "SCREW MACHINE",
            "WFL",
        ]
    }

    pub fn items() -> HashMap<u32, Vec<String>> {
        /// Returns a HashMap<K, V> where...
        /// K: category ID (numeric)
        /// V: collection of items in category K
        HashMap::from([
            (
                1,
                vec![
                    "DMG NLX".to_owned(),
                    "HT20S".to_owned(),
                    "HT25S".to_owned(),
                    "HT110".to_owned(),
                    "SL303-A".to_owned(),
                    "SL303-B".to_owned(),
                    "SL403".to_owned(),
                    "YAMA SEIKI A".to_owned(),
                    "YAMA SEIKI B".to_owned(),
                ],
            ),
            (
                2,
                vec![
                    "HURCO VM1".to_owned(),
                    "HURCO VMX42".to_owned(),
                    "HURCO VMX42I".to_owned(),
                    "HURCO VMX50".to_owned(),
                    "RA1".to_owned(),
                    "RA3".to_owned(),
                    "RA4A".to_owned(),
                    "RA4B".to_owned(),
                    "YAMA SEIKI 1600".to_owned(),
                ],
            ),
            (
                3,
                vec![
                    "HS6A".to_owned(),
                    "HU50 A".to_owned(),
                    "HU50 B".to_owned(),
                    "HU50 C".to_owned(),
                    "TOYODA".to_owned(),
                ],
            ),
            (4, vec!["DUOBLOCK".to_owned()]),
            (
                5,
                vec![
                    "CUBLEX".to_owned(),
                    "MAM 25-A".to_owned(),
                    "MAM 25-B".to_owned(),
                    "MAM 25-C".to_owned(),
                    "MAM 72-63".to_owned(),
                    "YASDA A".to_owned(),
                    "YASDA B".to_owned(),
                    "YASDA C".to_owned(),
                    "YASDA D".to_owned(),
                ],
            ),
            (
                6,
                vec![
                    "TRANE 1".to_owned(),
                    "TRANE 2".to_owned(),
                    "TRANE 3".to_owned(),
                    "TRANE 4".to_owned(),
                    "TRANE 5".to_owned(),
                    "TRANE 6".to_owned(),
                    "TRANE 7".to_owned(),
                    "TRANE 8".to_owned(),
                ],
            ),
            (
                7,
                vec![
                    "AIR COMPRESSOR 1".to_owned(),
                    "AIR COMPRESSOR 2".to_owned(),
                    "AIR COMPRESSOR 3".to_owned(),
                    "AIR COMPRESSOR 4".to_owned(),
                    "AIR COMPRESSOR 5".to_owned(),
                    "MAIN DRIER".to_owned(),
                    "SHOT PEEN DRIER".to_owned(),
                ],
            ),
            (
                8,
                vec![
                    "BRIDGEPORT MILL".to_owned(),
                    "BRIDGEPORT TOOLING".to_owned(),
                    "BRIDGEPORT TOYODA".to_owned(),
                    "BRIDGEPORT TURN".to_owned(),
                ],
            ),
            (
                9,
                vec![
                    "EDM WIRE C".to_owned(),
                    "EDM WIRE E".to_owned(),
                    "SODICK SINKER".to_owned(),
                ],
            ),
            (10, vec!["HYSTER LIFT".to_owned(), "YALE LIFT".to_owned()]),
            (
                11,
                vec![
                    "MITSUBISHI".to_owned(),
                    "OKAMOTO".to_owned(),
                    "OKAMOTO 1632".to_owned(),
                    "STUDER S30".to_owned(),
                    "STUDER S33".to_owned(),
                ],
            ),
            (
                12,
                vec![
                    "CHUCKER DEBUR".to_owned(),
                    "CHUCKER GRINDING".to_owned(),
                    "CHUCKER SCREW MACHINE".to_owned(),
                    "CHUCKER TOOLING".to_owned(),
                ],
            ),
            (
                13,
                vec![
                    "GREEN HONE".to_owned(),
                    "WFL HONE".to_owned(),
                    "WHITE HONE".to_owned(),
                ],
            ),
            (
                14,
                vec![
                    "7-AXIS SHOT PEEN".to_owned(),
                    "BEDUR CABINETS".to_owned(),
                    "BLUECOAT CABINET".to_owned(),
                    "SHOT PEEN BOOTH".to_owned(),
                    "SHOT PEEN CABINET".to_owned(),
                ],
            ),
            (
                15,
                vec![
                    "NT1".to_owned(),
                    "NT2".to_owned(),
                    "NT3".to_owned(),
                    "NT4".to_owned(),
                    "NT5".to_owned(),
                    "NT6".to_owned(),
                    "NT7".to_owned(),
                    "NT8".to_owned(),
                    "NT9".to_owned(),
                    "NT10".to_owned(),
                    "NT11".to_owned(),
                    "NT12".to_owned(),
                    "NT13".to_owned(),
                    "NT14".to_owned(),
                    "NT15".to_owned(),
                    "NT16".to_owned(),
                    "NT17".to_owned(),
                    "NT18".to_owned(),
                    "NT19".to_owned(),
                ],
            ),
            (
                16,
                vec![
                    "MILL SIDE".to_owned(),
                    "QUALITY".to_owned(),
                    "SCREW MACHINES".to_owned(),
                ],
            ),
            (17, vec!["OKUMA 750".to_owned(), "OKUMA VTM-120".to_owned()]),
            (
                18,
                vec!["BLUECOAT BOOTH".to_owned(), "PAINT BOOTH".to_owned()],
            ),
            (
                19,
                vec![
                    "GENIE SCISSOR LIFT".to_owned(),
                    "SKYJACK BOOM LIFT".to_owned(),
                ],
            ),
            (
                20,
                vec![
                    "AMADA SAW".to_owned(),
                    "DOALL SAW".to_owned(),
                    "TRUSS SAW".to_owned(),
                    "WELL SAW".to_owned(),
                ],
            ),
            (
                21,
                vec![
                    "KNC A".to_owned(),
                    "KNC B".to_owned(),
                    "KNC C".to_owned(),
                    "ST-38".to_owned(),
                    "SR-32".to_owned(),
                    "KJR".to_owned(),
                    "ECAS".to_owned(),
                ],
            ),
            (22, vec!["WFL A".to_owned(), "WFL B".to_owned()]),
        ])
    }
}
