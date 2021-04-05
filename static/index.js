$(document).ready(function () {
    const $energyUsageForm = $("form#energy-usage");
    const $yearStart = $("form#energy-usage input[name='year_start']");
    const $monthStart = $("form#energy-usage select[name='month_start']");
    const $yearEnd = $("form#energy-usage input[name='year_end']");
    const $monthEnd = $("form#energy-usage select[name='month_end']");
    const $submitButton = $("form#energy-usage input[type='submit']");

    const $usageResults = $("#usage-results");
    let usageChart = null;

    const onDateChange = function () {
        const rowProto = `<div class="input-group">
        <span class="input-group-text">%label%</span class="input-group-text">
        <input name="usage" data-date-code="%label%" type="number" min="0" step="0.1" value="%value%">
        <span class="input-group-text">kW</span>
        </div>`;

        let yearStart = Number($yearStart.val()),
            monthStart = Number($monthStart.val()),
            yearEnd = Number($yearEnd.val()),
            monthEnd = Number($monthEnd.val());

        let rowValues = {};

        $("#usage-rows input[name='usage']").each((index, row) => {
            let $row = $(row);
            rowValues[$row.data("date-code")] = $row.val();
        });

        const $usageRows = $("#usage-rows");

        $usageRows.children().remove();

        for (let year = yearStart, month = monthStart; 12 * year + month <= 12 * yearEnd + monthEnd;) {
            let dateCode = `${year}-${month.toString().padStart(2, "0")}`;
            let value = rowValues.hasOwnProperty(dateCode) ? rowValues[dateCode] : 0;

            let row = String(rowProto)
                .replaceAll("%label%", dateCode)
                .replaceAll("%value%", value)
            ;

            $usageRows.append($(row));

            month++;

            if (month > 12) {
                month = 1;
                year++;
            }
        }
    };

    const onSubmit = function (event) {
        event.preventDefault();
        $submitButton.prop("disabled", true);

        let formData = {};

        $(this).serializeArray().forEach(field => {
            const name = field["name"];
            const value = field["value"];

            if (name === "usage") {
                if (!formData.hasOwnProperty(name)) {
                    formData[name] = [];
                }

                formData[name].push(value);
            } else {
                formData[name] = value;
            }
        });

        $.post("/api/usage", formData)
            .done(repaintCharts)
            .always(() => $submitButton.prop("disabled", false));
    };

    const repaintCharts = function (data) {
        $usageResults.hide();

        if (usageChart !== null) {
            usageChart.destroy();
            usageChart = null;
        }

        usageChart = new Chart($("canvas#usage-chart").get(0).getContext("2d"),{
            type: "bar",
            responsive: true,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: "Wykres zużycia energii [kWh]"
                    }
                },
                scales: {
                    x: {beginAtZero: true},
                    y: {beginAtZero: true}
                }
            },
            data: {
                labels: data.months,
                datasets: [
                    {
                        label: "Zużycie symulowane (idealne)",
                        data: data.simUsage,
                        backgroundColor: "rgb(192, 0, 0)",
                        borderColor: "rgb(255, 0, 0)"
                    },
                    {
                        label: "Zużycie rzeczywiste",
                        data: data.realUsage,
                        backgroundColor: "rgb(0, 255, 0)"
                    }
                ]
            }
        });

        $usageResults.show();
    };

    $yearStart.change(onDateChange);
    $monthStart.change(onDateChange);
    $yearEnd.change(onDateChange);
    $monthEnd.change(onDateChange);
    onDateChange();

    $energyUsageForm.submit(onSubmit);
});