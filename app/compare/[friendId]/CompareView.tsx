"use client";
import { useState } from "react";
import Link from "next/link";
import Graph, { type GraphPoint } from "@/components/Graph";

type P = { id: string; yum: number; dollars: number; name: string };
type Try = {
  place_id: string; name: string; address: string | null; note: string | null; photo: string | null;
  friendYum: number; friendDollars: number; predictedYum: number;
};

export default function CompareView({
  friendName, mine, theirs, sharedIds, matchScore, yumBias, tryNext,
}: {
  friendName: string; mine: P[]; theirs: P[]; sharedIds: string[];
  matchScore: number | null; yumBias: number; tryNext: Try[];
}) {
  const [sharedOnly, setSharedOnly] = useState(sharedIds.length > 0);
  const [selected, setSelected] = useState<string | null>(null);
  const shared = new Set(sharedIds);
  const filter = (p: P) => !sharedOnly || shared.has(p.id);

  const points: GraphPoint[] = [
    ...mine.filter(filter).map((p) => ({ id: p.id, yum: p.yum, dollars: p.dollars, label: p.name, series: "me" as const })),
    ...theirs.filter(filter).map((p) => ({ id: p.id, yum: p.yum, dollars: p.dollars, label: p.name, series: "friend" as const })),
  ];
  const selMine = mine.find((p) => p.id === selected);
  const selTheirs = theirs.find((p) => p.id === selected);

  return (
    <>
      <div className="card match">
        {matchScore === null ? (
          <p>No places in common yet. Rate one of their spots below to get a taste match.</p>
        ) : (
          <>
            <div className="score">{matchScore}<span>%</span></div>
            <div>
              <b>taste match</b>
              <div className="muted small">
                across {sharedIds.length} shared place{sharedIds.length === 1 ? "" : "s"}
                {Math.abs(yumBias) >= 0.5 &&
                  ` · ${friendName} rates ${yumBias > 0 ? "higher" : "lower"} than you by ~${Math.abs(yumBias)}`}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="graph-wrap">
        <Graph points={points} links={sharedIds} selectedId={selected} onSelect={setSelected} />
      </div>
      <div className="row between">
        <span className="legend">
          <i className="dot-me" /> You <i className="dot-friend" /> {friendName}
        </span>
        <label className="toggle">
          <input type="checkbox" checked={sharedOnly} onChange={(e) => setSharedOnly(e.target.checked)} /> Shared only
        </label>
      </div>

      {(selMine || selTheirs) && (
        <div className="card">
          <div className="name">{(selMine ?? selTheirs)!.name}</div>
          <div className="small">
            {selMine ? <>You: 😋 {selMine.yum} · 💲 {selMine.dollars}</> : <span className="muted">You haven&apos;t rated it</span>}
            <br />
            {selTheirs ? <>{friendName}: 😋 {selTheirs.yum} · 💲 {selTheirs.dollars}</> : <span className="muted">{friendName} hasn&apos;t rated it</span>}
          </div>
          <Link href={`/rate/${encodeURIComponent(selected!)}`} className="btn small">{selMine ? "Edit my rating" : "Rate it"}</Link>
        </div>
      )}

      <section>
        <h2>Try next</h2>
        {tryNext.length === 0 ? (
          <p className="muted">Nothing new to suggest from {friendName}&apos;s graph yet.</p>
        ) : (
          <ul className="list">
            {tryNext.map((t) => (
              <li key={t.place_id} className="card place-card">
                {t.photo ? <img src={t.photo} alt="" className="thumb" loading="lazy" /> : <div className="thumb ph">🍽️</div>}
                <div className="grow">
                  <div className="name">{t.name}</div>
                  {t.address && <div className="muted small">{t.address}</div>}
                  <div className="small">
                    {friendName}: 😋 {t.friendYum} · 💲 {t.friendDollars}
                    {matchScore !== null && <> · <b>you&apos;d likely give ~{t.predictedYum}</b></>}
                  </div>
                  {t.note && <div className="note">“{t.note}”</div>}
                </div>
                <Link href={`/rate/${encodeURIComponent(t.place_id)}`} className="btn small">Been</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
