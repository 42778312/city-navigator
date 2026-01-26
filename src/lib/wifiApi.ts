export interface WifiSpot {
    id: string;
    name: string;
    coordinates: [number, number];
    source: string;
}

export const WIFI_SPOTS: WifiSpot[] = [
    {
        id: "fc-kn-ap007",
        name: "Marktstätte",
        coordinates: [9.175563, 47.660373],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "fc-kn-ap008",
        name: "Stadtgarten Kiosk",
        coordinates: [9.178723, 47.660608],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "fc-kn-ap018",
        name: "Marktstätte Unterführung",
        coordinates: [9.177201, 47.660374],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "fc-kn-ap009",
        name: "LAGO Bodanstraße",
        coordinates: [9.176288, 47.65773],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "fc-kn-ap017",
        name: "Bahnhof Parkleitsystem",
        coordinates: [9.177076, 47.659125],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "fc-kn-ap002",
        name: "Rosgartenstraße",
        coordinates: [9.174546, 47.658994],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "fc-kn-ap004",
        name: "Rosgartenstraße",
        coordinates: [9.174532, 47.658972],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "fc-kn-ap016",
        name: "Fischmarkt Richtung Stadtgarten",
        coordinates: [9.17788, 47.662024],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "RCK-APT300-15",
        name: "Fähre Vorplatz Konstanz",
        coordinates: [9.211273, 47.682241],
        source: "Stadtwerke Konstanz GmbH"
    },
    {
        id: "RCK-APT300-16",
        name: "Fähre Vorplatz Meersburg",
        coordinates: [9.265086, 47.694582],
        source: "Stadtwerke Konstanz GmbH"
    }
];
