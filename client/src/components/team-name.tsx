import * as React from "react";

type TeamNameProps = {
  teamName?: string | undefined
}

export default function TeamName({ teamName, className, ...props }: TeamNameProps & React.HTMLAttributes<HTMLDivElement>) {
  const capitals = teamName?.match(/([A-Z])/g) ?? [];
  const split = teamName?.split(/[A-Z]/);
  split?.shift();

  return (
    <div className={"flex flex-wrap " + className ?? ""} {...props}>
      {split?.map((text: string, i: number) => (
        <p key={i}>{capitals[i] + text}</p>
      ))}
    </div>
  );
}
