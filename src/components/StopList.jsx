function StopList({ stopListArr, allStops }) {
  return (
    <div
      id="stopListContainer"
      className="flex justify-center flex-col items-center mt-8"
    >
      {stopListArr.length > 0 &&
        stopListArr.map((stopObj) => {
          const { bound, route, seq, service_type, stop } = stopObj;
          const stopArrWithName = allStops.filter((s) => {
            return s.stop === stop;
          });
          return (
            <div
              className="py-2 px-4 cursor-pointer flex item-center border border-rose-500 w-[300px] rounded-md mb-4 hover:bg-rose-100"
              key={stop}
            >
              {seq} - {stopArrWithName[0].name_tc}
            </div>
          );
        })}
    </div>
  );
}

export default StopList;
