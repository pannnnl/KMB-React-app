import { useState, useEffect } from "react";
import Logo from "./components/Logo";
import SearchForm from "./components/SearchForm";
import BoundContainer from "./components/BoundContainer";
import StopList from "./components/StopList";

const baseURL = "https://data.etabus.gov.hk/v1/transport/kmb";

function App() {
  const [errorMsg, setErrorMsg] = useState("");
  const [allRoutes, setAllRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState([]);
  const [selectedRouteObj, setSelectedRouteObj] = useState({});
  const [stopList, setStopList] = useState([]);

  useEffect(() => {
    async function fetchRouteData() {
      const routeAPI = `${baseURL}/route`;
      const res = await fetch(routeAPI);
      const results = await res.json();
      setAllRoutes(results.data);
    }

    async function fetchStopData() {
      const stopAPI = `${baseURL}/stop`;
      const res = await fetch(stopAPI);
      const results = await res.json();
      setAllStops(results.data);
    }

    fetchRouteData();
    fetchStopData();
  }, []);

  useEffect(() => {
    async function fetchRouteStop() {
      const { route, service_type, bound } = selectedRouteObj;

      const routeStopAPI = `${baseURL}/route-stop`;
      const res = await fetch(
        `${routeStopAPI}/${route}/${
          bound === "I" ? "inbound" : "outbound"
        }/${service_type}`
      );
      const results = await res.json();
      setStopList(results.data);
    }

    fetchRouteStop();
  }, [selectedRouteObj]);

  function checkRouteExists(userInput) {
    const busRoutes = [];
    for (let i = 0; i < allRoutes.length; i++) {
      if (allRoutes[i].route === userInput) {
        busRoutes.push(allRoutes[i]);
      }
    }
    if (busRoutes.length < 1) {
      return setErrorMsg("無呢條線喎！");
    }
    setSelectedRoute(busRoutes);
  }

  function handleShowError(msg) {
    setErrorMsg(msg);
  }
  console.log(stopList);
  return (
    <>
      <Logo />
      <div className="container mx-auto">
        <SearchForm
          showError={handleShowError}
          checkRouteExists={checkRouteExists}
        />
      </div>
      {errorMsg && (
        <p
          id="errorMsg"
          className="border bg-rose-50 border-rose-600 py-2 px-4 rounded-md w-[200px] text-center mx-auto"
        >
          {errorMsg}
        </p>
      )}
      {selectedRoute.length > 0 && (
        <BoundContainer
          routeArr={selectedRoute}
          selectRouteObj={setSelectedRouteObj}
        />
      )}
      <StopList stopListArr={stopList} allStops={allStops} />
    </>
  );
}

export default App;
