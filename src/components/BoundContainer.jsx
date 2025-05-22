export default function BoundContainer({ routeArr, selectRouteObj }) {
  return (
    <div className="flex justify-center">
      {routeArr.map((routeObj) => {
        const { orig_tc, dest_tc, route, service_type, bound } = routeObj;
        return (
          <div
            key={`${route}-${service_type}-${bound}`}
            className="border border-rose-500 bg-rose-50 text-rose-600 rounded-md px-4 py-2 cursor-pointer hover:bg-rose-200 transition duration-300 mr-2"
            onClick={() => selectRouteObj(routeObj)}
          >
            {orig_tc} ➡️ {dest_tc}
          </div>
        );
      })}
    </div>
  );
}
