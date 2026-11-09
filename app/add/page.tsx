import Shell from "@/components/Shell";
import { requireProfile } from "@/lib/data";
import PlaceSearch from "./PlaceSearch";

export default async function AddPage() {
  await requireProfile();
  return (
    <Shell title="Add a place" active="add">
      <PlaceSearch />
    </Shell>
  );
}
