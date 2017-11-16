// Making the connection
const socket = io();

const chart = {
    totalHeight: 600,
    totalWidth: 800,
    margin: {
        top: 25,
        bottom: 75,
        left: 50,
        right: 25
    },
};
chart.height = chart.totalHeight - (chart.margin.top + chart.margin.bottom);
chart.width = chart.totalWidth - (chart.margin.left + chart.margin.right);

// The main SVG Element
const svg = d3.select('#chart')
    .append('svg')
    .classed('stocks', true)
    .attr('viewBox', `0, 0, ${chart.totalWidth}, ${chart.totalHeight}`);

// X-Axis
const xScale = d3.scaleTime()
    .range([0, chart.width]);

// Y-axis
const yScale = d3.scaleLinear()
    .range([chart.height, 0]);

// Color Scale
const colorScale = d3.scaleOrdinal()
    .range(d3.schemeCategory10);

// Line
const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => xScale(Date.parse(d.date)))
    .y(d => yScale(d.close));

function prepareData(arrayOfSymbols) {
    const promisesToBeMade = arrayOfSymbols.map(x => {
        return new Promise(function(resolve, reject) {
            d3.json(('/api/test/' + x), (err, data) => {
                if (err) { reject(err) }
                resolve({
                    id: x,
                    values: data
                })
            })
        })
    });

    return Promise.all(promisesToBeMade)
}

prepareData(['GE', 'MSFT' , 'AAPL'])
    .then(data => {
        const minClose = d3.min(data, d => d3.min(d.values, x => +x.close));
        const maxClose = d3.max(data, d => d3.max(d.values, x => +x.close));

        const minDate = d3.min(data, d => d3.min(d.values, x => Date.parse(x.date)));
        const maxDate = d3.max(data, d => d3.max(d.values, x => Date.parse(x.date)));

        xScale
            .domain([minDate, maxDate])
            .nice(10);

        yScale
            .domain([minClose, maxClose]);

        colorScale
            .domain(data.map(x => x.id));

        // Y - axis
        const yAxis = d3.axisLeft().scale(yScale);
        svg
            .append('g')
            .attr('transform', `translate(${chart.margin.left}, ${chart.margin.top})`)
            .call(yAxis);

        // X-axis
        const xAxis = d3.axisBottom().scale(xScale);
        svg.append('g')
            .attr('transform', `translate(${chart.margin.left}, ${chart.margin.top + chart.height})`)
            .call(xAxis);

        const plots = svg.append('g')
            .classed('lines', true)
            .selectAll('path')
            .data(data);

        plots
            .exit().remove();

        plots
            .enter()
            .append('path')
            .merge(plots)
            .attr('transform', `translate(${chart.margin.left}, ${chart.margin.top})`)
            .attr('stroke', d => colorScale(d.id))
            .attr('fill', 'none')
            .attr('d', d => line(d.values))

    });

