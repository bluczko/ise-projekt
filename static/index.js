$(document).ready(function () {
    const $energyUsageForm = $("form#energy-usage");
    const $latitude = $("form#energy-usage input[name='latitude']");
    const $longitude = $("form#energy-usage input[name='longitude']");
    const $yearStart = $("form#energy-usage input[name='year_start']");
    const $monthStart = $("form#energy-usage select[name='month_start']");
    const $yearEnd = $("form#energy-usage input[name='year_end']");
    const $monthEnd = $("form#energy-usage select[name='month_end']");
    const $submitButton = $("form#energy-usage input[type='submit']");

    let usageChart = null;
    let diffChart = null;

    const onDateChange = function () {
        const rowProto = `<div class="input-group">
        <span class="input-group-text">%label%</span class="input-group-text">
        <input class="form-control" name="usage" data-date-code="%label%" type="number" min="0" step="0.01" value="%value%">
        <span class="input-group-text">kWh</span>
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

        const mockData = new URLSearchParams(new URL(document.location.href).search).has("mock");

        for (let year = yearStart, month = monthStart; 12 * year + month <= 12 * yearEnd + monthEnd;) {
            let dateCode = `${year}-${month.toString().padStart(2, "0")}`;
            let value = rowValues.hasOwnProperty(dateCode) ? rowValues[dateCode] : 0;

            if (mockData) {
                value = 12000 + 2000 * Math.random() + 10000 * Math.pow(Math.cos(((12 * year + month) * Math.PI) / 12), 2);
                value = Math.round((value + Number.EPSILON) * 100) / 100;
            }

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
        if (usageChart !== null) {
            usageChart.destroy();
            usageChart = null;
        }

        usageChart = new Chart($("canvas#usage-chart").get(0).getContext("2d"), {
            type: "bar",
            responsive: true,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: "Zużycie energii [kWh]"
                    }
                }
            },
            data: {
                labels: data.months,
                datasets: [
                    {
                        label: "Symulowane",
                        data: data.simUsage,
                        backgroundColor: "rgb(64, 64, 192)"
                    },
                    {
                        label: "Rzeczywiste",
                        data: data.realUsage,
                        backgroundColor: "rgb(64, 192, 64)"
                    }
                ]
            }
        });

        if (diffChart !== null) {
            diffChart.destroy();
            diffChart = null;
        }

        let diffData = data.simUsage.map((simValue, i) => simValue - data.realUsage[i]);

        diffChart = new Chart($("canvas#diff-chart").get(0), {
            type: "bar",
            responsive: true,
            maintainAspectRatio: true,
            data: {
                labels: data.months,
                datasets: [{
                    label: "Różnica",
                    data: diffData,
                    backgroundColor: diffData.map(v => v > 0 ? "rgb(64, 192, 64)" : "rgb(192, 64, 64)")
                }]
            }
        });
    };

    $yearStart.change(onDateChange);
    $monthStart.change(onDateChange);
    $yearEnd.change(onDateChange);
    $monthEnd.change(onDateChange);
    onDateChange();

    $energyUsageForm.submit(onSubmit);

    const $mapModal = $("#map-modal");
    let map = null;
    let mapMarker = null;

    $("#open-map").click(function () {
        $mapModal.modal("show");

        let latitude = Number($latitude.val());
        let longitude = Number($longitude.val());

        if (map === null) {
            map = L.map("map-modal-body");

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            mapMarker = L.marker([latitude, longitude]).addTo(map);

            map.on("click", function (event) {
                let pos = map.mouseEventToLatLng(event.originalEvent);
                mapMarker.setLatLng([
                    Math.round(pos.lat * 100000) / 100000,
                    Math.round(pos.lng * 100000) / 100000
                ]);
            });
        }

        map.setView([latitude, longitude], 13);
    });

    $("#map-modal-cancel").click(() => {
        let latitude = Number($latitude.val());
        let longitude = Number($longitude.val());

        mapMarker.setLatLng([latitude, longitude]);

        $mapModal.modal("hide");
    });

    $("#map-modal-select").click(() => {
        let pos = mapMarker.getLatLng();
        $latitude.val(pos.lat);
        $longitude.val(pos.lng);
        $mapModal.modal("hide");
    });

    $mapModal.on("shown.bs.modal", function () {
        setTimeout(function () {
            if (map !== null) {
                map.invalidateSize();
            }
        }, 10);
    });
});