"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import Graph from "@/components/Graph";
import { Scores } from "@/components/PlaceCard";
import { deleteRating, saveRating } from "@/app/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn primary" disabled={pending}>{pending ? "Saving…" : label}</button>;
}

export default function RateForm({
  placeId, name, initial, others,
}: {
  placeId: string;
  name: string;
  initial: { yum: number; dollars: number; note: string } | null;
  others: { id: string; yum: number; dollars: number; label: string }[];
}) {
  const [yum, setYum] = useState(initial?.yum ?? 5);
  const [dollars, setDollars] = useState(initial?.dollars ?? 5);

  return (
    <>
      <div className="graph-wrap small">
        <Graph
          points={[
            ...others.map((o) => ({ ...o, series: "me" as const })),
            { id: placeId, yum, dollars, label: name, series: "preview" as const },
          ]}
          selectedId={placeId}
        />
      </div>
      <form action={saveRating} className="stack">
        <input type="hidden" name="place_id" value={placeId} />
        <label className="slider">
          <span className="row between"><span>😋 Yum yums</span><b>{yum}</b></span>
          <input type="range" name="yum" min={0} max={10} step={0.5} value={yum}
            onChange={(e) => setYum(Number(e.target.value))} />
          <span className="row between muted small"><span>bleh</span><span>life-changing</span></span>
        </label>
        <label className="slider">
          <span className="row between"><span>💲 Dollars</span><b>{dollars}</b></span>
          <input type="range" name="dollars" min={0} max={10} step={0.5} value={dollars}
            onChange={(e) => setDollars(Number(e.target.value))} />
          <span className="row between muted small"><span>basically free</span><span>splurge</span></span>
        </label>
        <div className="center"><Scores yum={yum} dollars={dollars} /></div>
        <label>
          Note <span className="muted">(optional)</span>
          <input name="note" maxLength={280} defaultValue={initial?.note} placeholder="Get the dumplings" />
        </label>
        <Submit label={initial ? "Save changes" : "Add to my graph"} />
      </form>
      {initial && (
        <form action={deleteRating} onSubmit={(e) => { if (!confirm(`Remove ${name} from your graph?`)) e.preventDefault(); }}>
          <input type="hidden" name="place_id" value={placeId} />
          <button className="btn ghost danger">Remove from my graph</button>
        </form>
      )}
    </>
  );
}
