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
  const dx = 14;
  const dy = 220;
  const duration = 250;

  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  // Build hierarchy from your `contents` field
  const root = d3.hierarchy(rootData, d => d.contents);

  // Give each node a stable id and set initial positions
  root.each((d, i) => (d.id = i));
  root.x0 = 0;
  root.y0 = 0;

  // Start collapsed below depth 1 (so folders are expandable)
  root.each(d => {
    if (d.depth > 1 && d.children) {
      d._children = d.children;
      d.children = null;
    }
  });

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("style", "max-width: 100%; height: auto; font: 12px system-ui; user-select: none;");

  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.35)
    .attr("stroke-width", 1.25);

  const gNode = svg.append("g");

  function label(d) {
    const icon = d.data.type === "directory" ? "📁 " : "📄 ";
    return icon + (d.data.name ?? "(unnamed)");
  }

  function update(source) {
    // Compute new tree layout
    tree(root);

    // Compute bounds for auto height/viewBox
    let left = root, right = root;
    root.eachBefore(n => {
      if (n.x < left.x) left = n;
      if (n.x > right.x) right = n;
    });

    const height = right.x - left.x + dx * 4;

    const transition = svg.transition()
      .duration(duration)
      .attr("height", height)
      .attr("viewBox", [-dy / 3, left.x - dx * 2, width, height]);

    // ---- NODES ----
    const nodes = root.descendants();

    const node = gNode.selectAll("g")
      .data(nodes, d => d.id);

    const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .attr("opacity", 0)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        // Only directories can expand/collapse
        if (d.data.type !== "directory") return;

        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      });

    nodeEnter.append("circle")
      .attr("r", 3.5)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1.25)
      .attr("fill", d => d._children ? "currentColor" : "white");

    nodeEnter.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d._children ? -8 : 8)
      .attr("text-anchor", d => d._children ? "end" : "start")
      .text(label)
      .attr("fill", "currentColor")
      .clone(true).lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    node.merge(nodeEnter).transition(transition)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .attr("opacity", 1);

    node.exit().transition(transition)
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .attr("opacity", 0)
      .remove();

    // Update circle fill as state changes
    gNode.selectAll("g").select("circle")
      .transition(transition)
      .attr("fill", d => d._children ? "currentColor" : "white");

    // ---- LINKS ----
    const links = root.links();

    const link = gLink.selectAll("path")
      .data(links, d => d.target.id);

    link.enter().append("path")
      .attr("d", () => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      })
      .merge(link)
      .transition(transition)
      .attr("d", diagonal);

    link.exit().transition(transition)
      .attr("d", () => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      })
      .remove();

    // Stash old positions for transitions
    root.eachBefore(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  update(root);
  return svg.node();
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
