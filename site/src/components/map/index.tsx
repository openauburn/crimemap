/* eslint-disable */
"use client";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";

interface MapProps {
  data: any;
}

export default function Map(props: MapProps) {
  const [crimeData, setCrimeData] = useState<any>({});

  const [heatPoints, setHeatPoints] = useState<any>([
    [32.6040317, -85.4904066, 14],
  ]);

  useEffect(() => {
    if (props.data !== undefined) {
      setCrimeData(props.data);
      var totalCount = props.data.count;
      var data = props.data.latlong;
      const result = [];
      for (const latLongStr in data) {
        let latLongArr = latLongStr.split("|");
        let lat = parseFloat(latLongArr[0]);
        let long = parseFloat(latLongArr[1]);
        let intensity = (data[latLongStr].count / totalCount) * 100;
        if (intensity > 0) {
          result.push([lat, long, intensity]);
        }
      }
      console.log(result);
      setHeatPoints(result);
    }
  }, [props]);
  function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
  function haversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Returns distance in kilometers
  }

  function getLocalIncidents(lat: any, lon: any): any {
    var data = props.data.latlong;
    var localIncidents: any = {};

    Object.entries(data).forEach(([latLongStr, incidents]: [string, any]) => {
      incidents = incidents.dist;
      let latLongArr = latLongStr.split("|");
      let d_lat = parseFloat(latLongArr[0]);
      let d_lon = parseFloat(latLongArr[1]);

      const roundedLat1 = Math.round(lat * 1e6) / 1e6;
      const roundedLon1 = Math.round(lon * 1e6) / 1e6;
      const roundedLat2 = Math.round(d_lat * 1e6) / 1e6;
      const roundedLon2 = Math.round(d_lon * 1e6) / 1e6;

      const distance = haversine(
        roundedLat1,
        roundedLon1,
        roundedLat2,
        roundedLon2
      );

      if (distance <= 0.05) {
        for (const key in incidents) {
          localIncidents[key] = (localIncidents[key] || 0) + incidents[key];
        }
      }
    });

    let sortedLocalIncidents: any = Object.entries(localIncidents).sort(
      (a: any, b: any) => b[1] - a[1]
    );

    // If the dictionary has more than 5 items, sum the rest and add an "Other" entry
    if (sortedLocalIncidents.length > 5) {
      const top5Entries = sortedLocalIncidents.slice(0, 5); // Get the first 5 entries
      const otherSum = sortedLocalIncidents
        .slice(5)
        .reduce((sum: any, entry: any) => sum + entry[1], 0); // Sum the remaining entries

      // Convert the top 5 entries back to a dictionary and add "Other"
      sortedLocalIncidents = Object.fromEntries(top5Entries);
      sortedLocalIncidents["Other"] = otherSum;
    } else {
      sortedLocalIncidents = Object.fromEntries(sortedLocalIncidents);
    }

    // console.log(sortedLocalIncidents.length);
    // Format the string to show `key: percentage` separated by newlines
    if (Object.keys(sortedLocalIncidents).length > 0) {
      return Object.entries(sortedLocalIncidents)
        .map(([key, count]: [any, any]) => `${key}: ${count}`)
        .join("<br>");
    } else {
      return "";
    }
  }

  useEffect(() => {
    const map = L.map("map").setView([32.6032098, -85.485284], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    var points = heatPoints.length ? heatPoints : [];

    L.heatLayer(points, { radius: 45 }).addTo(map);

    var popup = L.popup();

    function onMapClick(e) {
      let content = getLocalIncidents(e.latlng.lat, e.latlng.lng);
      if (content !== "") {
        popup.setLatLng(e.latlng).setContent(content).openOn(map);
      }
    }

    map.on("click", onMapClick);

    return () => {
      map.remove();
    };
  }, [heatPoints]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    ></div>
  );
}
