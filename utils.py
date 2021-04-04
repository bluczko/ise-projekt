from datetime import timedelta, datetime
import numpy as np

from suntime import Sun


def days_range(start: datetime, end: datetime):
    """
    Wygodny generator, który zwraca kolejne dni w zakresie podanych dat.
    Działa podobnie do generatora range, ale na datach.
    :param start: początek przedziału czasowego
    :param end: koniec przedziału czasowego
    :return: kolejne obiekty datetime dni w podanym zakresie
    """

    dt = start
    yield dt

    while dt < end:
        yield dt
        dt = dt + timedelta(days=1)


def months_range(start: datetime, end: datetime):
    """
    Generator miesięcy. Działa podobnie do days_range.
    :param start: początek przedziału czasowego
    :param end: koniec przedziału czasowego
    :return: kolejne krotki (rok, miesiąc)
    """

    last_year, last_month = end.year, end.month

    year, month = start.year, start.month
    yield year, month

    while 100 * year + month < 100 * last_year + last_month:
        month += 1

        if month > 12:
            month = 1
            year += 1

        yield year, month


def dt2td(dt):
    """
    Konwersja z obiektu datetime do timedelta
    :param dt: obiekt datetime
    :return: obiekt timedelta
    """

    return timedelta(hours=dt.hour, minutes=dt.minute, seconds=dt.second)


def calc_nights(latitude: float, longitude: float, dt_start: datetime, dt_end: datetime):
    """
    Oblicza długość nocy w podanych koordynatach geograficznych na podanym przedziale czasowym
    :param latitude: długość geograficzna
    :param longitude: szerokość geograficzna
    :param dt_start: początek przedziału czasowego
    :param dt_end: koniec przedziału czasowego
    :return: tablica Numpy z długościami nocy
    """

    sun = Sun(lat=latitude, lon=longitude)

    # Przygotuj puste listy na daty dni oraz ich czasy świtów i zmierzchów
    days = []
    sunrises = []
    sunsets = []

    # Dla każdego dnia...
    for dt in days_range(dt_start, dt_end):

        # Oblicz czas świtu i zmierzchu danego dnia
        sunrise = sun.get_sunrise_time(dt)
        sunset = sun.get_sunset_time(dt)

        # Dopisz do listy
        days.append(dt)
        sunrises.append(dt2td(sunrise).seconds / 3600)
        sunsets.append(dt2td(sunset).seconds / 3600)

    return days, 24 - (np.array(sunsets) - np.array(sunrises))


def group_monthly(days: [datetime], values: np.array):
    """
    Sumuje podane wartości zapisów według miesięcy
    :param days: lista obiektów datetime
    :param values: odpowiadające podanym datom wartości
    :return: zgrupowane (zsumowane) według lat i miesięcy dane
    """

    months = []
    monthly_usage = []

    # Dla każdego roku i miesiąca...
    for year, month in months_range(days[0], days[-1]):
        # Wybieramy z listy tylko te dni zużycia, w których zgadza się miesiąc
        mdays_power_usage = [values[days.index(dt)] for dt in days if dt.year == year and dt.month == month]

        # Suma zużycia liczona w kWh
        months.append(f"{year}-{str(month).zfill(2)}")
        monthly_usage.append(np.sum(mdays_power_usage))

    return months, np.array(monthly_usage)
