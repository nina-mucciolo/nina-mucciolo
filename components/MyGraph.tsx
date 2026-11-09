"use client";
import { useState } from "react";
import Graph from "./Graph";
import PlaceCard, { type CardItem } from "./PlaceCard";

export default function MyGraph({ items, initialSelected }: { items: CardItem[]; initialSelected: string | null }) {
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [labels, setLabels] = useState(false);
  const sel = items.find((i) => i.id === selected);

  return (
    <>
      <div className="graph-wrap">
        <Graph
          points={items.map((i) => ({ id: i.id, yum: i.yum, dollars: i.dollars, label: i.name, series: "me" }))}
          selectedId={selected}
          onSelect={setSelected}
          showLabels={labels}
        />
      </div>
      <div className="row between">
        <span className="muted small">{items.length} place{items.length === 1 ? "" : "s"} · tap a dot</span>
        <label className="toggle"><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} /> Names</label>
      </div>
      {sel && <PlaceCard item={sel} editable />}
      <ul className="list">
        {items.map((i) => (
          <li key={i.id}>
            <button className={`list-btn ${i.id === selected ? "on" : ""}`} onClick={() => setSelected(i.id)}>
              <span className="name">{i.name}</span>
              <span className="muted small">😋 {i.yum} · 💲 {i.dollars}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
