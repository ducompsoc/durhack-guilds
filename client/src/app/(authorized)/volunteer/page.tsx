"use client";

import dynamic from "next/dynamic";

const Volunteer = dynamic(
  () => import("./(volunteer)/volunteer-page"),
  {
    ssr: false,
  }
);

export default function VolunteerPage() {
  return <Volunteer />;
}
