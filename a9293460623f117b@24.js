function _1(md){return(
md`# Google Drive Visualizer`
)}

function _gdrive(FileAttachment){return(
FileAttachment("gdrive.json").json()
)}

function _rootData(gdrive){return(
gdrive[0]
)}

function _chart(d3,rootData,width)
{
  const dx = 22;
  const duration = 250;

  // ---- label helpers ----
  function icon(d) {
    return d.data.type === "directory" ? "📁 " : "📄 ";
  }

  const MAX_CHARS = 200;
  function truncate(s) {
    s = String(s ?? "");
    return s.length > MAX_CHARS ? s.slice(0, MAX_CHARS - 1) + "…" : s;
  }

  function fullName(d) {
    return String(d.data?.name ?? "(unnamed)");
  }

  function label(d) {
    return icon(d) + truncate(fullName(d));
  }

  // ---- build hierarchy ----
  const root = d3.hierarchy(rootData, d => d.contents);
  root.each((d, i) => (d.id = i));
  root.x0 = 0;
  root.y0 = 0;

  function collapseAll(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    }
    if (d._children) d._children.forEach(collapseAll);
  }

  // Initial state: root open (1 level visible), everything below collapsed
  if (root.children) root.children.forEach(collapseAll);

  // ---- measure label width to set dy dynamically ----
  const font = "12px system-ui";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = font;

  const allNodes = root.descendants();
  const maxLabelWidth = d3.max(allNodes, d => ctx.measureText(label(d)).width) ?? 0;

  const PAD = 30;
  const dy = Math.max(220, Math.ceil(maxLabelWidth + PAD));

  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  // ---- scroll container ----
  const container = document.createElement("div");
  container.style.overflow = "auto";
  container.style.maxWidth = "100%";
  container.style.border = "1px solid rgba(0,0,0,0.1)";
  container.style.borderRadius = "8px";

  const svg = d3.create("svg")
    .attr("style", `display:block; font:${font}; user-select:none;`);

  container.appendChild(svg.node());

  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.35)
    .attr("stroke-width", 1.25);

  const gNode = svg.append("g");

  function update(source) {
    tree(root);

    // bounds for height
    let left = root, right = root;
    root.eachBefore(n => {
      if (n.x < left.x) left = n;
      if (n.x > right.x) right = n;
    });

    // bounds for width (max depth)
    const maxY = d3.max(root.descendants(), d => d.y) ?? 0;

    // Give room for labels to the right
    const requiredWidth = Math.max(width, Math.ceil(maxY + 10 + maxLabelWidth + 40));
    const height = right.x - left.x + dx * 4;

    const transition = svg.transition()
      .duration(duration)
      .attr("width", requiredWidth)
      .attr("height", height)
      .attr("viewBox", [0, left.x - dx * 2, requiredWidth, height]);

    // ---- nodes ----
    const nodes = root.descendants();
    const node = gNode.selectAll("g")
      .data(nodes, d => d.id);

    const nodeEnter = node.enter().append("g")
      .attr("transform", () => `translate(${source.y0},${source.x0})`)
      .attr("opacity", 0)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        if (d.data.type !== "directory") return;

        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;

          // expand one level only
          d.children?.forEach(collapseAll);
        }
        update(d);
      });

    nodeEnter.append("circle")
      .attr("r", 3.5)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1.25)
      .attr("fill", d => d._children ? "currentColor" : "white");

    const text = nodeEnter.append("text")
      .attr("dy", "0.31em")
      .attr("x", 10)                 // always right of dot
      .attr("text-anchor", "start")
      .attr("fill", "currentColor")
      .text(label);

    // Full name on hover
    text.append("title").text(d => icon(d) + fullName(d));

    // White halo
    text.clone(true).lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    node.merge(nodeEnter).transition(transition)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .attr("opacity", 1);

    node.exit().transition(transition)
      .attr("transform", () => `translate(${source.y},${source.x})`)
      .attr("opacity", 0)
      .remove();

    // circle fill sync
    gNode.selectAll("g").select("circle")
      .transition(transition)
      .attr("fill", d => d._children ? "currentColor" : "white");

    // ---- links ----
    const link = gLink.selectAll("path")
      .data(root.links(), d => d.target.id);

    link.enter().append("path")
      .attr("d", () => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      })
      .merge(link)
      .transition(transition)
      .attr("d", diagonal);

    link.exit().transition(transition).remove();

    root.each(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  update(root);
  return container;
}


function _d3(require){return(
require("d3@7")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["gdrive.json", {url: new URL("./files/aae2dbb9de357488c2275c14907d6fecc07f83de3f4fb6a5a3d566a3211c51a7d71e6445f7faff0f58a90ddeff9b2dd766ecd6d90550a82c382c920dbf5b8051.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("gdrive")).define("gdrive", ["FileAttachment"], _gdrive);
  main.variable(observer("rootData")).define("rootData", ["gdrive"], _rootData);
  main.variable(observer("chart")).define("chart", ["d3","rootData","width"], _chart);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
