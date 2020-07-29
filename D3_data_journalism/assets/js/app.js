//Set up margins for chart:

let svgWidth = 900;
let svgHeight = 600;

let margin = {
    top: 20,
    right: 40,
    bottom: 80,
    left: 100
};

let width = svgWidth - margin.left - margin.right;
let height = svgHeight - margin.top - margin.bottom;

//Append chart to page:

let svg = d3.select('#scatter')
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)

let chartGroup = svg.append('g')
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Initial parameters
let chosenXAxis = 'poverty';
let chosenYAxis = 'healthcare';

//function used for updating x scale on click
function xScale(stateData, chosenXAxis) {
    //create scales
    let xLinearScale = d3.scaleLinear()
        .domain([d3.min(stateData, d => d[chosenXAxis]) * 0.8,
            d3.max(stateData, d => d[chosenXAxis]) * 1.2
        ])
        .range([0, width]);

    return xLinearScale;
}

//function used to update y axis
function yScale(stateData, chosenYAxis) {
    let yLinearScale = d3.scaleLinear()
        .domain([d3.max(stateData, d => d[chosenYAxis]) * 1.2,
            d3.min(stateData, d => d[chosenYAxis]) * .8
        ])
        .range([0, height]);

    return yLinearScale;
}

//function used for updating xAxis upon click axis label
function renderXAxes(newXScale, xAxis) {
    let bottomAxis = d3.axisBottom(newXScale);

    xAxis.transition()
        .duration(1000)
        .call(bottomAxis);

    return xAxis;
}

//function to update y axis
function renderYAxes(newYScale, yAxis) {
    let leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
        .duration(1000)
        .call(leftAxis);

    return yAxis;
}

//function to update circles
function renderCircles(circlesGroup, newXScale, chosenXAxis, newYScale, chosenYAxis) {

    circlesGroup.transition()
      .duration(1000)
      .attr("cx", d => newXScale(d[chosenXAxis]))
      .attr('cy', d => newYScale(d[chosenYAxis]));
  
    return circlesGroup;
}

//Update circle text
function renderCirclesText(textGroup, newXScale, chosenXAxis, newYScale, chosenYAxis) {
    textGroup.transition()
        .duration(1000)
        .attr("x", d => newXScale(d[chosenXAxis]) -5)
        .attr("y", d => newYScale(d[chosenYAxis]) +5);

    return textGroup;
}

//function to update circles
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {
    let xLabel;
    let yLabel;

    if (chosenXAxis === 'poverty') {
        xLabel = 'In Poverty (%):';
    }
    else if (chosenXAxis === 'age') {
        xLabel = 'Age:';
    }
    else if (chosenXAxis === 'income') {
        xLabel = 'Household Income';
    }
    
    if (chosenYAxis === 'healthcare') {
        yLabel = "Lack Healthcare (%):";
    } 
    else if (chosenYAxis === 'smokes') {
        yLabel = "Smokes (%):";
    } 
    else if (chosenYAxis === 'obesity') {
        yLabel = "Obesity:";
    };
    
    let toolTip = d3
        .tip()
        .attr('class', 'd3-tip')
        .offset([80, -60])
        .html(function(d) {
            return (`${d.state}<br>${xLabel} ${d[chosenXAxis]}<br>${yLabel} ${d[chosenYAxis]}`);
    });

    circlesGroup.call(toolTip);

    //Show tooltip on mouseover/hide on mouseout
    circlesGroup.on("mouseover", function(data) {
        toolTip.show(data);
    })
        // onmouseout event
        .on("mouseout", function(data, index) {
         toolTip.hide(data);
    });

    return circlesGroup;

}


//Read in data

d3.csv("../assets/data/data.csv").then(function(stateData, err) {
    if (err) throw err;
    console.log(stateData);

    //Parse data
    stateData.forEach(function(data) {
        data.poverty = +data.poverty;
        data.healthcare = +data.healthcare;
        data.age = +data.age;
        data.smokes = +data.smokes;
        data.income = +data.income;
        data.obesity = +data.obesity;
    });

    //Add scale functions
    let xLinearScale = xScale(stateData, chosenXAxis);
    let yLinearScale = yScale(stateData, chosenYAxis);

    //Create axis functions
    let bottomAxis = d3.axisBottom(xLinearScale);
    let leftAxis = d3.axisLeft(yLinearScale);

    // Append the X axis 
    let xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // Append the Y axis
    let yAxis = chartGroup.append("g")
        .classed("y-axis", true)
        .attr("transform", `translate(0, 0)`)
        .call(leftAxis);

    //Create circles
    let circlesGroup = chartGroup.selectAll('circle')
    .data(stateData)
    .enter()
    .append('circle')
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr('r', '15')
    .attr('fill', 'blue')
    .attr('opacity', '.75');

    // Create a group for the state abbreviations
    let circlesLabels = chartGroup.append("g")
        .classed("circ_labels", true);

    // Write the state abbreviations to the same locations as their associated circle
    let textGroup = circlesLabels.selectAll('text')
        .data(stateData)
        .enter()
        .append("text")
        .attr("x", d => xLinearScale(d[chosenXAxis]) - 5)
        .attr("y", d => yLinearScale(d[chosenYAxis]) + 5)
        .text(d => d.abbr)
        .attr("font-size", "10px")
        .attr("fill", "white");

    // Create group for x-axis labels
    let xLabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

    // Create the 3 X axis labels
    let povertyLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "poverty") // value to grab for event listener
        .classed("active", true)
        .text("Poverty (%)");

    let ageLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "age") // value to grab for event listener
        .classed("inactive", true)
        .text("Age (Median)");

    let incomeLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "income") // value to grab for event listener
        .classed("inactive", true)
        .text("Household Income (Median)");

    // Create group for y-axis labels
    let yLabelsGroup = chartGroup.append("g")
        .attr("transform", "rotate(-90)");

    // Create 3 Y axis labels
    let healthcareLabel = yLabelsGroup.append("text")
        .attr("y", 0 - margin.left + 40)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .attr("value", "healthcare") // value to grab for event listener
        .classed("active", true)
        .classed("axis-text", true)
        .text("Lack Healthcare (%)");

    let smokesLabel = yLabelsGroup.append("text")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .attr("value", "smokes") // value to grab for event listener
        .classed("inactive", true)
        .classed("axis-text", true)
        .text("Smokes (%)");

    let obesityLabel = yLabelsGroup.append("text")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .attr("value", "obesity") // value to grab for event listener
        .classed("inactive", true)
        .classed("axis-text", true)
        .text("Obese (%)");

    // Update circlesGroup
    circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

    // Listen for click on X axis labels
    xLabelsGroup.selectAll("text")
        .on("click", function() {
            // get value of selection
        let xValue = d3.select(this).attr("value");
        if (xValue !== chosenXAxis) {

            // replaces chosenXAxis with value
            chosenXAxis = xValue;

            // updates x scale for new data
            xLinearScale = xScale(stateData, chosenXAxis);

            // updates x axis with transition
            xAxis = renderXAxes(xLinearScale, xAxis);

            // updates circles with new x values
            circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

            // updates circle labels
            textGroup = renderCirclesText(textGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

            // updates tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

            // Bold X axis label 
            if (chosenXAxis === "income") {
                incomeLabel
                    .classed("active", true)
                    .classed("inactive", false);
                povertyLabel
                    .classed("active", false)
                    .classed("inactive", true);
                ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
            } 
            else if (chosenXAxis === "age") {
                incomeLabel
                    .classed("active", false)
                    .classed("inactive", true);
                povertyLabel
                    .classed("active", false)
                    .classed("inactive", true);
                ageLabel
                    .classed("active", true)
                    .classed("inactive", false);
            }
            else {
                incomeLabel
                    .classed("active", false)
                    .classed("inactive", true);
                povertyLabel
                    .classed("active", true)
                    .classed("inactive", false);
                ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
        }
    });

    // Listen for click on Y axis labels
    yLabelsGroup.selectAll("text")
        .on("click", function() {
            // get value of selection
            var yValue = d3.select(this).attr("value");
            if (yValue !== chosenYAxis) {

                // replaces chosenYAxis with value
                chosenYAxis = yValue;

                // updates y scale for new data
                yLinearScale = yScale(stateData, chosenYAxis);

                // updates y axis with transition
                yAxis = renderYAxes(yLinearScale, yAxis);

                // updates circles with new y values
                circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                // update state abbreviations
                textGroup = renderCirclesText(textGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                // update tooltips 
                circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                // Bold Y axis label 
                if (chosenYAxis === "healthcare") {
                    healthcareLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true);
                } else if (chosenYAxis === "obesity") {
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    obesityLabel
                        .classed("active", true)
                        .classed("inactive", false);
                } else {
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    smokesLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true);
                }
            }
        });

}).catch(function(error) {
    console.log(error);
});