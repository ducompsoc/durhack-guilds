import * as React from "react"
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import annotationPlugin, { AnnotationOptions } from "chartjs-plugin-annotation";
import { Options } from "chartjs-plugin-datalabels/types/options";
import { useMediaQuery } from "react-responsive";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "tailwindcss/defaultConfig";
import useSWR from "swr";

import { fetchMegateamsApi } from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartDataLabels,
  annotationPlugin
);

export default function MegaChart() {
  const { data: { megateams } = { megateams: null } } = useSWR(
    "/megateams",
    fetchMegateamsApi,
    { refreshInterval: 1000 }
  );

  megateams?.sort((a: any, b: any) => {
    return a.megateam_name.localeCompare(b.megateam_name);
  });

  const isDark = useMediaQuery({
    query: "(prefers-color-scheme: dark)",
  });

  const { theme } = resolveConfig(tailwindConfig);

  let largestPoints = 0;

  megateams?.forEach((megateam: any) => {
    megateam.image = new Image();
    megateam.image.src = `/${megateam.megateam_name}/icon.png`;
    if (megateam.points > largestPoints) {
      largestPoints = megateam.points;
    }
  });

  const dataset = {
    labels: megateams?.map((team: any) => team.megateam_name),
    datasets: [
      {
        label: "Points",
        data: megateams?.map((team: any) => team.points),
        ...(isDark
          ? {
              // @ts-ignore
              backgroundColor: theme.colors.neutral[700],
            }
          : {}),
      },
    ],
  };

  const datalabels: Options = {
    anchor: "start",
    align: "end",
    ...(isDark
      ? {
          // @ts-ignore
          color: theme.colors.neutral[200],
        }
      : {}),
  };

  const options = {
    scales: {
      y: { display: false },
      x: {
        grid: { display: false },
        ...(isDark
          ? {
              // @ts-ignore
              ticks: { color: theme.colors.neutral[200] },
            }
          : {}),
      },
    },
    plugins: {
      datalabels,
      annotation: {
        annotations: megateams?.map((team: any, i: number) => {
          const options: AnnotationOptions = {
            type: "box",
            yMin: Math.max(largestPoints * 0.6, team.points * 0.75),
            yMax: Math.max(largestPoints * 0.6, team.points * 0.75),
            xMax: i,
            xMin: i,
            label: {
              display: true,
              content: team.image,
              width: 50,
              height: 50,
              position: "center",
            },
          };
          return options;
        }),
      },
    },
  };

  return (
    <Bar
      data={dataset}
      options={options}
      key={`${isDark ? "dark" : "light"}`}
    />
  );
}
