"use client";

import * as React from "react";
import { useFormState } from "react-hooks-use-form-state";
import Select from "react-select";
import useSWR from "swr";
import ReactPaginate from "react-paginate";
import type { Guild, Team, Area } from "@durhack/guilds-common/types/index";

import { ButtonModal } from "@/components/button-modal";
import { fetchGuildsApi } from "@/lib/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function TeamsPage() {
  const { mutate: mutateTeams, data: teamsData = { teams: [] } } = useSWR<{
    teams: Team[];
  }>("/teams");
  const [teams, setTeams, resetForm] = useFormState(teamsData.teams);
  const { data: { guilds } = { guilds: [] } } = useSWR<{
    guilds: Guild[];
  }>("/areas");
  const [message, setMessage] = React.useState("");
  const [messageOpen, setMessageOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [searchTextActive, setSearchTextActive] = React.useState("");
  const [itemOffset, setItemOffset] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(0);

  const lowerSearch = searchTextActive.toLowerCase();
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(lowerSearch)
  );

  const itemsPerPage = 50;
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = filteredTeams.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filteredTeams.length / itemsPerPage);

  function handlePageClick(event: { selected: number }) {
    const newOffset = (event.selected * itemsPerPage) % filteredTeams.length;
    setItemOffset(newOffset);
    setPageNumber(event.selected);
  }

  function handleSearchText(text: string) {
    setSearchText(text);
    if (!text) {
      setSearchTextActive(text);
      setItemOffset(0);
      setPageNumber(0);
    }
  }

  function search() {
    setSearchTextActive(searchText);
    setItemOffset(0);
    setPageNumber(0);
  }

  function changeGuild(team: Team, name: string) {
    const newTeams = [...teams];
    team.area = { guild: { guild_name: name } };
    setTeams(newTeams);
  }

  function changeArea(team: Team, area?: Area) {
    const newTeams = [...teams];
    team.area.area_id = area?.area_id;
    setTeams(newTeams);
  }

  function getGuild(guildName?: string) {
    const filteredGuilds = guilds.filter(
      ({ guild_name }) => guild_name === guildName
    );
    return filteredGuilds.length ? filteredGuilds[0] : undefined;
  }

  function getArea(guild?: Guild, area_id?: number) {
    const filteredAreas =
      guild?.areas?.filter((area: Area) => area.area_id === area_id) ?? [];
    return filteredAreas.length ? filteredAreas[0] : null;
  }

  async function saveTeam(team: Team) {
    if (Number.isInteger(team?.area?.area_id)) {
      try {
        await fetchGuildsApi("/teams/" + team.team_id, {
          method: "PATCH",
          body: JSON.stringify({ area_code: team.area.area_id }),
          headers: { "Content-Type": "application/json" },
        });
        setMessage("Successfully updated team!");
        await mutateTeams();
        resetForm();
      } catch {
        setMessage("Failed to update team!");
      }
    } else {
      setMessage("Please select a Guild and Area!");
    }
    setMessageOpen(true);
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="dh-box p-4">
          <div className="flex flex-row items-center">
            <input
              type="text"
              className="dh-input w-full pl-10"
              placeholder="Search for teams..."
              value={searchText}
              onChange={(e) => handleSearchText(e.target.value)}
            />
            <MagnifyingGlassIcon className="w-6 h-6 absolute ml-2" />
            <button className="dh-btn ml-2" onClick={search}>
              Search
            </button>
          </div>
        </div>
        <ReactPaginate
          breakLabel="..."
          nextLabel=">"
          onPageChange={handlePageClick}
          pageCount={pageCount}
          previousLabel="<"
          renderOnZeroPageCount={null}
          marginPagesDisplayed={2}
          pageRangeDisplayed={1}
          forcePage={pageNumber}
          className="dh-paginate my-6"
        />
        {currentItems.map((team) => {
          const guild = getGuild(team.area?.guild?.guild_name);
          const area = getArea(guild, team.area?.area_id);
          return (
            <div className="dh-box p-4 mb-4" key={team.join_code}>
              <p className="mb-1">{team.name}</p>
              <p className="mb-2 text-gray-600 dark:text-neutral-400">
                Join code: {team.join_code}
              </p>
              <select
                className="by-2 dh-input w-full"
                value={guild?.guild_name ?? ""}
                onChange={(e) => changeGuild(team, e.target.value)}
              >
                <option disabled value="">
                  Assign a guild!
                </option>
                {guilds.map(({ guild_name }) => (
                  <option key={guild_name} value={guild_name}>
                    {guild_name}
                  </option>
                ))}
              </select>
              <Select
                options={guild?.areas ?? []}
                className="mt-2 dh-select"
                classNamePrefix="dh-select"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                getOptionLabel={(option: Area) => option.name!}
                getOptionValue={(option: Area) => option.area_id!.toString()}
                value={area}
                onChange={(area) => changeArea(team, area ?? undefined)}
              />
              <div className="md:flex md:justify-end">
                <button
                  className="w-full dh-btn mt-2 md:w-fit"
                  onClick={() => saveTeam(team)}
                >
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <ButtonModal
        show={messageOpen}
        onClose={(bool) => setMessageOpen(bool)}
        content={<p className="dark:text-neutral-200">{message}</p>}
        itemsClass="items-center"
        buttons={
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setMessageOpen(false)}
          >
            Close
          </button>
        }
      />
    </>
  );
}
