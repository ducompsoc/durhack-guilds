"use client";

import * as React from "react";
import { useFormState } from "react-hooks-use-form-state";
import Select from "react-select";
import useSWR from "swr";
import ReactPaginate from "react-paginate";

import { ButtonModal } from "@/components/button-modal";
import { fetchMegateamsApi } from "@/lib/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function TeamsPage() {
  const { mutate: mutateTeams, data: teamsData = { teams: [] } } = useSWR<{
    teams: any[];
  }>("/teams");
  const [teams, setTeams, resetForm] = useFormState(teamsData.teams);
  const { data: { megateams } = { megateams: [] } } = useSWR<{
    megateams: any[];
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

  function changeMegateam(team: any, name: string) {
    const newTeams = [...teams];
    team.area = { megateam: { megateam_name: name } };
    setTeams(newTeams);
  }

  function changeArea(team: any, area: any) {
    const newTeams = [...teams];
    team.area.area_id = area.areaId;
    setTeams(newTeams);
  }

  function getMegateam(megateam_name: string) {
    const filteredMegateams = megateams.filter(
      ({ megateamName }) => megateamName === megateam_name
    );
    return filteredMegateams.length ? filteredMegateams[0] : null;
  }

  function getArea(megateam: any, area_id: number) {
    const filteredAreas =
      megateam?.areas?.filter((area: any) => area.areaId === area_id) ?? [];
    return filteredAreas.length ? filteredAreas[0] : null;
  }

  async function saveTeam(team: any) {
    if (Number.isInteger(team?.area?.area_id)) {
      try {
        await fetchMegateamsApi("/teams/" + team.team_id, {
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
      setMessage("Please select a Megateam and Area!");
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
          const megateam = getMegateam(team.area?.megateam?.megateam_name);
          const area = getArea(megateam, team.area?.area_id);
          return (
            <div className="dh-box p-4 mb-4" key={team.join_code}>
              <p className="mb-1">{team.name}</p>
              <p className="mb-2 text-gray-600 dark:text-neutral-400">
                Join code: {team.join_code}
              </p>
              <select
                className="by-2 dh-input w-full"
                value={megateam?.megateamName ?? ""}
                onChange={(e) => changeMegateam(team, e.target.value)}
              >
                <option disabled value="">
                  Assign a megateam!
                </option>
                {megateams.map(({ megateamName }) => (
                  <option key={megateamName} value={megateamName}>
                    {megateamName}
                  </option>
                ))}
              </select>
              <Select
                options={megateam?.areas ?? []}
                className="mt-2 dh-select"
                classNamePrefix="dh-select"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                getOptionLabel={(option: any) => option.areaName}
                getOptionValue={(option: any) => option.areaId}
                value={area}
                onChange={(area) => changeArea(team, area)}
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
