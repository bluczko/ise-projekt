/*(function() {
    var map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.marker([51.5, -0.09]).addTo(map)
        .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        .openPopup();
})();*/

$(document).ready(function () {
    const $yearStart = $("#energy-usage table tr td input[name='year_start']");
    const $monthStart = $("#energy-usage table tr td input[name='month_start']");
    const $yearEnd = $("#energy-usage table tr td input[name='year_end']");
    const $monthEnd = $("#energy-usage table tr td input[name='month_end']");

    const $usageRows = $("#usage-rows");

    const rowProto = `<tr>
    <td><label>%label%</label></td>
    <td><input name="usage[]" type="number" min="0" step="0.1" value="0"> [kW]</td>
    </tr>`;

    const onDateChange = function () {
        let ys = $yearStart.val(), ms = $monthStart.val(),
            ye = $yearEnd.val(), me = $monthEnd.val();

        let monthsDiff = 12 * (ye - ys) + (me - ms);

        $usageRows.children().remove();

        for (let i = 0, y = ys, m = ms; i < monthsDiff; i++) {
            let dateCode = `${y}-${m.toString().padStart(2, "0")}`;
            let row = String(rowProto).replace("%label%", dateCode);

            $usageRows.append($(row));

            m++;

            if (m > 12) {
                m = 1;
                y++;
            }
        }
    };

    $yearStart.change(onDateChange);
    $monthStart.change(onDateChange);
    $yearEnd.change(onDateChange);
    $monthEnd.change(onDateChange);

    onDateChange();
});