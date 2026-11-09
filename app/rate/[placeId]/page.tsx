import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { photoUrl, ratingsFor, requireProfile, type Place } from "@/lib/data";
import RateForm from "./RateForm";

export default async function RatePage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId: raw } = await params;
  const placeId = decodeURIComponent(raw);
  const { supabase, user } = await requireProfile();

  const { data: place } = await supabase.from("places").select("*").eq("place_id", placeId).maybeSingle<Place>();
  if (!place) notFound();
  const mine = await ratingsFor(supabase, user.id);
  const existing = mine.find((r) => r.place_id === placeId);

  return (
    <Shell title={existing ? "Edit rating" : "Rate it"} active="add">
      <div className="card place-head">
        {place.photo_path ? (
          <figure>
            <img src={photoUrl(place.photo_path)!} alt="" className="hero" />
            {place.photo_attribution && (
              <figcaption className="muted small">
                Photo:{" "}
                {place.photo_attribution_uri ? (
                  <a href={place.photo_attribution_uri} target="_blank" rel="noreferrer">{place.photo_attribution}</a>
                ) : place.photo_attribution}{" "}
                via Google
              </figcaption>
            )}
          </figure>
        ) : null}
        <div className="pad">
          <div className="name big">{place.name}</div>
          {place.address && <div className="muted small">{place.address}</div>}
        </div>
      </div>
      <RateForm
        placeId={place.place_id}
        name={place.name}
        initial={existing ? { yum: existing.yum, dollars: existing.dollars, note: existing.note ?? "" } : null}
        others={mine.filter((r) => r.place_id !== placeId).map((r) => ({
          id: r.place_id, yum: r.yum, dollars: r.dollars, label: r.place.name,
        }))}
      />
    </Shell>
  );
}
