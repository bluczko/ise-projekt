from flask import Flask, request, render_template, jsonify, Response
from .utils import *

app = Flask(__name__)


@app.route("/")
def view_index():
    """
    Widok strony domyślnej z formularzem do wprowadzenia danych.
    """
    return render_template("index.html")


@app.route("/api/usage", methods=["POST"])
def view_usage():
    """
    Widok strony obliczającej i wyświetlającej zużycie w postaci raportu.
    Zwraca wyniki w postaci obiektu JSON.

    Podana strona spodziewa się otrzymać fomularz z kluczami:
      - set_energy
      - latitude
      - longitude
      - year_start
      - month_start
      - year_end
      - month_end
      - usage (wielokrotnie)

    W odpowiedzi klient dostaje obiekt JSON:
    {
        months: float[],
        simUsage: float[]
        realUsage: string[]
    }
    """

    try:
        # Moc podana w kilowatach
        set_energy = float(request.form["set_energy"])
        assert set_energy > 0

        # Położenie geograficzne
        latitude = float(request.form["latitude"])
        longitude = float(request.form["longitude"])
        assert -83 < latitude < 83
        assert -180 < longitude < 180

        # Zakresy czasowe
        dt_start = datetime(year=int(request.form["year_start"]), month=int(request.form["month_start"]), day=1)
        dt_end = datetime(
            year=int(request.form["year_end"]),
            month=int(request.form["month_end"]),
            day=last_day_of_month(int(request.form["year_end"]), int(request.form["month_end"])))

        assert dt_start < dt_end

        # Rzeczywiste (empiryczne) zużycie wprowadzone prze użytkownika
        real_usage = np.array([float(u) for u in request.form.getlist("usage[]")])

        # Długość trwania nocy
        days, night_durations = calc_nights(latitude, longitude, dt_start, dt_end)

        # Symulowane (idealne) zużycie energii
        months, sim_usage = group_monthly(days, night_durations * set_energy)

        assert real_usage.shape == sim_usage.shape, (real_usage.size, sim_usage.size)
    except AssertionError:
        return Response(status=400)

    return jsonify({
        "months": months,
        "simUsage": sim_usage.tolist(),
        "realUsage": real_usage.tolist(),
    })


if __name__ == "__main__":
    app.run()
