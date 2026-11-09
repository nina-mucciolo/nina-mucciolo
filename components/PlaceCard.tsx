import Link from "next/link";
import { valueLabel } from "@/lib/compare";

export type CardItem = {
  id: string;
  name: string;
  address: string | null;
  yum: number;
  dollars: number;
  note?: string | null;
  photo: string | null;
};

export function Scores({ yum, dollars }: { yum: number; dollars: number }) {
  const label = valueLabel({ yum, dollars });
  return (
    <span className="scores">
      <span title="yum yums">😋 {yum}</span>
      <span title="dollars">💲 {dollars}</span>
      <span className={`badge v-${label.replace(/\W/g, "").toLowerCase()}`}>{label}</span>
    </span>
  );
}

export default function PlaceCard({ item, editable }: { item: CardItem; editable?: boolean }) {
  return (
    <div className="card place-card">
      {item.photo ? <img src={item.photo} alt="" className="thumb" loading="lazy" /> : <div className="thumb ph">🍽️</div>}
      <div className="grow">
        <div className="name">{item.name}</div>
        {item.address && <div className="muted small">{item.address}</div>}
        <Scores yum={item.yum} dollars={item.dollars} />
        {item.note && <div className="note">“{item.note}”</div>}
      </div>
      {editable && <Link href={`/rate/${encodeURIComponent(item.id)}`} className="btn small">Edit</Link>}
    </div>
  );
}
