import React from "react";
import {
  hierarchy,
  scaleOrdinal,
  schemeTableau10,
  treemap as d3Treemap,
} from "d3";

function Text({ x, y, name, value, width, height, fill = "white" }) {
  if (width < 42 || height < 22) return null;

  return (
    <>
      <text
        x={x + 4}
        y={y + 14}
        fontSize={11}
        fill={fill}
        pointerEvents="none"
      >
        {name}
      </text>
      {height >= 36 && (
        <text
          x={x + 4}
          y={y + 28}
          fontSize={11}
          fill={fill}
          pointerEvents="none"
        >
          {`value: ${value}`}
        </text>
      )}
    </>
  );
}

export function TreeMap(props) {
  const {
    margin,
    svg_width,
    svg_height,
    tree,
    selectedCell,
    setSelectedCell,
  } = props;

  const innerWidth = svg_width - margin.left - margin.right;
  const innerHeight = svg_height - margin.top - margin.bottom;
  const legendWidth = 170;
  const legendGap = 12;
  const treemapWidth = Math.max(innerWidth - legendWidth - legendGap, 120);

  const root = hierarchy(tree)
    // Only count leaf values to avoid double-counting parent totals.
    .sum((d) => (d.children ? 0 : d.value || 0))
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  d3Treemap()
    .size([treemapWidth, innerHeight])
    .paddingOuter(0)
    .paddingInner(2)(root);

  const leaves = root.leaves().filter((d) => (d.value || 0) > 0);

  if (leaves.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${svg_width} ${svg_height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <text x={10} y={20} fontSize={12} fill="#666">
            No data
          </text>
        </g>
      </svg>
    );
  }

  const getLeafLabel = (leaf) =>
    leaf
      .ancestors()
      .reverse()
      .slice(1)
      .map((d) => `${d.data.attr || "group"}: ${d.data.name}`)
      .join(" / ");

  const getThirdLevelLabel = (leaf) => {
    const thirdLevelNode = leaf.ancestors().find((d) => d.depth === 3);
    const targetNode = thirdLevelNode || leaf;
    return `${targetNode.data.attr || "group"}: ${targetNode.data.name}`;
  };

  const thirdLevelDomain = Array.from(
    new Set(leaves.map((leaf) => getThirdLevelLabel(leaf)))
  );

  const color = scaleOrdinal(schemeTableau10).domain(thirdLevelDomain);

  const getDisplayLabel = (leaf) =>
    leaf
      .ancestors()
      .reverse()
      .slice(1, 3)
      .map((d) => `${d.data.attr || "group"}: ${d.data.name}`)
      .join(" / ");

  return (
    <svg
      viewBox={`0 0 ${svg_width} ${svg_height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {leaves.map((leaf, i) => {
          const width = leaf.x1 - leaf.x0;
          const height = leaf.y1 - leaf.y0;
          const leafLabel = getLeafLabel(leaf);
          const thirdLevelLabel = getThirdLevelLabel(leaf);

          const fillColor = color(thirdLevelLabel);

          const isSelected = selectedCell?.label === leafLabel;

          return (
            <g
              key={i}
              onClick={() => {
                if (setSelectedCell) {
                  setSelectedCell({
                    label: leafLabel,
                    name: leaf.data.name,
                    value: leaf.value,
                  });
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={leaf.x0}
                y={leaf.y0}
                width={width}
                height={height}
                fill={fillColor}
                stroke={isSelected ? "black" : "white"}
                strokeWidth={isSelected ? 2 : 1}
              />
              <Text
                x={leaf.x0}
                y={leaf.y0}
                name={getDisplayLabel(leaf)}
                value={leaf.value}
                width={width}
                height={height}
              />
            </g>
          );
        })}

        <g transform={`translate(${treemapWidth + legendGap}, 0)`}>

          {thirdLevelDomain.map((item, i) => (
            <g key={item} transform={`translate(0, ${24 + i * 18})`}>
              <rect x={0} y={-10} width={12} height={12} fill={color(item)} />
              <text x={18} y={0} fontSize={11} fill="#333">
                {item}
              </text>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}