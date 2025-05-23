import { useState, useEffect } from "react";

function BoundContainer({ routeArr, selectRouteObj }) {
  const [selectedRoute, setSelectedRoute] = useState(null);

  // 動態生成城巴路線的來回線選項
  const generateCtbBounds = (route) => {
    return [
      {
        ...route,
        bound: "O", // 去線
        orig_tc: route.orig_tc || "未知起點",
        dest_tc: route.dest_tc || "未知終點",
      },
      {
        ...route,
        bound: "I", // 回線
        orig_tc: route.dest_tc || "未知起點",
        dest_tc: route.orig_tc || "未知終點",
      },
    ];
  };

  // 處理路線選擇
  const handleRouteClick = (route) => {
    setSelectedRoute(route);
    selectRouteObj(route);
  };

  // 渲染路線選項
  const renderRoutes = () => {
    if (routeArr.length === 0) return null;

    // 按公司分組
    const kmbRoutes = routeArr.filter(
      (route) => (route.company || route.co) === "KMB"
    );
    const ctbRoutes = routeArr.filter(
      (route) => (route.company || route.co) === "CTB"
    );

    return (
      <div className="flex justify-center space-x-4">
        {/* 常規路線 */}
        <div className="w-1/2">
          <h3 className="text-lg font-bold text-[#2b2b2b] mb-2">常規路線</h3>
          {kmbRoutes
            .filter((route) => route.service_type === "1")
            .map((route, index) => (
              <div
                key={index}
                className="cursor-pointer border border-[#2b2b2b] p-3 rounded-md mb-3 hover:bg-[#999999]"
                onClick={() => handleRouteClick(route)}
              >
                <p>
                  {route.orig_tc} → {route.dest_tc}
                  {/* （{route.bound === "O" ? "去線" : "回線"}） */}
                </p>
              </div>
            ))}
          {ctbRoutes.length > 0 &&
            generateCtbBounds(ctbRoutes[0]).map((bound, index) => (
              <div
                key={`ctb-${index}`}
                className="cursor-pointer border border-[#2b2b2b] p-3 rounded-md mb-3 hover:bg-[#999999]"
                onClick={() => handleRouteClick(bound)}
              >
                <p>
                  {bound.orig_tc} → {bound.dest_tc}
                  {/* （{bound.bound === "O" ? "去線" : "回線"}） */}
                </p>
              </div>
            ))}
        </div>
        {/* 特別班次 */}
        <div className="w-1/2">
          <h3 className="text-lg font-bold text-[#2b2b2b] mb-2">特別班次</h3>
          {kmbRoutes
            .filter((route) => route.service_type !== "1")
            .map((route, index) => (
              <div
                key={index}
                className="cursor-pointer border border-[#2b2b2b] p-3 rounded-md mb-3 hover:bg-[#999999]"
                onClick={() => handleRouteClick(route)}
              >
                <p>
                  {route.orig_tc} → {route.dest_tc}
                  {/* （{route.bound === "O" ? "去線" : "回線"}） */}
                </p>
              </div>
            ))}
          {kmbRoutes.filter((route) => route.service_type !== "1").length ===
            0 && <p className="text-gray-500">無特別班次</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center">{renderRoutes()}</div>
    </div>
  );
}

export default BoundContainer;
