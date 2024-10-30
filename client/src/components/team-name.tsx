import * as React from "react";

import { cn } from "@/lib/utils";

type TeamNameProps = {
  teamName?: string | undefined
}

export default function TeamName({ teamName, className, ...props }: TeamNameProps & React.HTMLAttributes<HTMLDivElement>) {
  const capitalBoundaryRegExp = /(?<=[a-z])(?=[A-Z])/
  const words = teamName?.split(capitalBoundaryRegExp)

  return (
    <div className={cn("flex flex-wrap", className)} {...props}>
      {words?.map((text: string, i: number) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
}
