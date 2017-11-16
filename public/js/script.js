// Making the connection
const socket = io();
let symbols = [];

const chart = {
    totalHeight: 400,
    totalWidth: 600,
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

svg.append('g')
    .classed('x-axis', true)
    .attr('transform', `translate(${chart.margin.left}, ${chart.margin.top + chart.height})`)

svg.append('text')
    .attr('transform', `translate(${chart.totalWidth / 2}, ${ chart.totalHeight - (chart.margin.bottom / 2) })`)
    .classed('x-label', true)
    .text('Date')
    .attr('text-anchor', 'middle');

// Y-axis
const yScale = d3.scaleLinear()
    .range([chart.height, 0]);

svg
    .append('g')
    .classed('y-axis', true)
    .attr('transform', `translate(${chart.margin.left}, ${chart.margin.top})`);

svg.append('text')
    .attr('transform', `translate(${chart.margin.left / 2}, ${ chart.totalHeight / 2 }) rotate(-90)`)
    .classed('y-label', true)
    .text('$ USD')
    .attr('text-anchor', 'middle');

// Color Scale
const colorScale = d3.scaleOrdinal()
    .range(d3.schemeCategory10);

// Line
const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => xScale(Date.parse(d.date)))
    .y(d => yScale(d.close));

svg.append('g')
    .classed('lines', true);

// Tooltip
const tooltip = d3.select('body')
    .append('div')
    .classed('tooltip', true);

// Socket configuration
socket.on('update', function(symbolList) {
    d3.select('.info').remove();
    symbols = symbolList;
    if (symbolList.length === 0) {
        svg.selectAll('.lines path').remove();
        d3.select('#symbols').html('');
        svg.append('text')
            .classed('info', true)
            .attr('text-anchor', 'middle')
            .text('Nothing to show')
            .attr('transform', `translate(${ chart.totalWidth / 2 }, ${ chart.totalHeight / 2 })`)
        return;
    }
    prepareData(symbolList)
        .then(data => {
            for (let i = 0; i < data.length; i++) {
                if (data[i].error) {
                    alert('Something went wrong with the request!');
                    return;
                }
            }
            drawGraph(data);
        });
    const symbolBox = d3.select('#symbols');
    symbolBox.html('');
    let htmlToUpdate = '';
    symbols.forEach(x => {
        htmlToUpdate +=
        `<div class='symbol box'>
            <a data-symbol='${ x }' class='delete'></a>
            <h3>${ x }</h3>
        </div>`
    });
    symbolBox.html(htmlToUpdate);
    d3.selectAll('.delete')
        .on('click', () => {
            let symbolToDelete = d3.event.target.dataset['symbol'];
            socket.emit('delete', symbolToDelete);
        })
});

d3.select('#add')
    .on('submit', () => {
       d3.event.preventDefault();
        d3.select('.help').html('');
       const s = d3.select('#symbol-input');
       if (window.company.indexOf(s.property('value').toUpperCase()) === -1) {
            d3.select('.help').html('This symbol does not exist.');
            return;
       }
       if (symbols.indexOf(s) !== -1) {
           // TODO: Change the alert to a modal
           alert('This is already graphed!');
           return;
       }
       socket.emit('add', s.property('value'));
        s.property('value', '');
    });

// Function for Graph
function prepareData(arrayOfSymbols) {
    const promisesToBeMade = arrayOfSymbols.map(x => {
        return new Promise(function(resolve, reject) {
            d3.json(('/api/' + x), (err, data) => {
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

function drawGraph(data) {
    // Extent of Y values
    const minClose = d3.min(data, d => d3.min(d.values, x => +x.close));
    const maxClose = d3.max(data, d => d3.max(d.values, x => +x.close));

    // Extent of X values
    const minDate = d3.min(data, d => d3.min(d.values, x => Date.parse(x.date)));
    const maxDate = d3.max(data, d => d3.max(d.values, x => Date.parse(x.date)));

    // Setting the scales
    xScale.domain([minDate, maxDate]);
    yScale.domain([minClose, maxClose]);
    colorScale.domain(data.map(x => x.id));

    // Y - axis
    const yAxis = d3.axisLeft()
        .scale(yScale)
        .tickSize(-chart.width)
        .tickSizeOuter(0);

    d3.select('.y-axis')
        .call(yAxis);

    // X-axis
    const xAxis = d3.axisBottom().scale(xScale)
        .ticks(5)
        .tickSize(-chart.height)
        .tickSizeOuter(0);

    d3.select('.x-axis')
        .call(xAxis);

    // Lines
    const plots = d3.select('.lines')
        .selectAll('path')
        .data(data, d => d.id);

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
        .on('mouseover', (d) => {
            d3.select('.tooltip')
                .style('left', d3.event.x + 'px')
                .style('top', (d3.event.y + window.scrollY - 30) + 'px')
                .style('opacity', 1)
                .html(d.id)
        })
        .on('mouseout', (d) => {
            d3.select('.tooltip')
                .transition()
                .duration(300)
                .style('opacity', 0)
        })
}
