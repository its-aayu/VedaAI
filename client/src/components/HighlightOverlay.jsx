export default function HighlightOverlay({ regions, label }) {
  return (
    <>
      {regions.map((region, i) => {
        const { ymin, xmin, ymax, xmax } = region.bbox;
        const style = {
          top: `${ymin / 10}%`,
          left: `${xmin / 10}%`,
          width: `${(xmax - xmin) / 10}%`,
          height: `${(ymax - ymin) / 10}%`,
        };
        return (
          <div key={i} style={style} className="absolute rounded-sm border-2 border-highlight bg-highlight/20">
            {label && (
              <span className="absolute -top-5 left-0 rounded bg-highlight px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                Q{label}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
