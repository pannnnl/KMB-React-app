export default function BoundContainer({ routeArr, selectRouteObj }) {
  // 根據 service_type 分組
  const regularRoutes = routeArr.filter(
    (routeObj) => routeObj.service_type === "1"
  );
  const specialRoutes = routeArr.filter(
    (routeObj) => routeObj.service_type !== "1"
  );

  return (
    <div className="flex justify-center mt-4 gap-4">
      {/* 左欄：常規路線 */}
      <div className="w-[250px] flex flex-col items-center">
        {regularRoutes.length > 0 && (
          <>
            <h3 className="text-rose-600 font-semibold mb-2">常規</h3>
            {regularRoutes.map((routeObj) => {
              const { orig_tc, dest_tc, route, service_type, bound } = routeObj;
              return (
                <div
                  key={`${route}-${service_type}-${bound}`}
                  className="border border-rose-500 bg-rose-50 text-rose-600 rounded-md px-4 py-2 cursor-pointer hover:bg-rose-200 transition duration-300 mb-2 w-[200px] text-center"
                  onClick={() => selectRouteObj(routeObj)}
                >
                  {orig_tc} ➡️ {dest_tc}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 右欄：特別班次 */}
      <div className="w-[250px] flex flex-col items-center">
        {specialRoutes.length > 0 && (
          <>
            <h3 className="text-rose-600 font-semibold mb-2">特別班次</h3>
            {specialRoutes.map((routeObj) => {
              const { orig_tc, dest_tc, route, service_type, bound } = routeObj;
              return (
                <div
                  key={`${route}-${service_type}-${bound}`}
                  className="border border-rose-500 bg-rose-50 text-rose-600 rounded-md px-4 py-2 cursor-pointer hover:bg-rose-200 transition duration-300 mb-2 w-[200px] text-center"
                  onClick={() => selectRouteObj(routeObj)}
                >
                  {orig_tc} ➡️ {dest_tc}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
