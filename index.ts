import TinyDsl from "./tiny-dsl";

const dsl = new TinyDsl();

dsl.defineCommand({
  name: "add",
  args: ["int", "int"],
  exec: ([a, b]): number => a + b
});

dsl.defineCommand({
  name: "weather",
  args: ["str"],
  exec: async function* ([city]) {

    yield "getting coordinates...";

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
    );

    if (!geoRes.ok) throw new Error(geoRes.statusText);

    const geoJson: any = await geoRes.json();
    const result = geoJson?.results?.[0];
    if (!result) throw new Error("city not found");

    const { latitude: lat, longitude: lon } = result;

    yield "fetching weather...";

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    if (!weatherRes.ok) throw new Error(weatherRes.statusText);

    const weatherJson: any = await weatherRes.json();
    const weather = weatherJson?.current_weather;

    if (!weather) throw new Error("weather not found");

    return `Current weather in ${city} is ${weather.temperature}°C`;
  }
});

console.log(dsl.parse("add", "add(1,2)"));

const data = dsl.parseAsync("weather", "weather(kolkata)");

while (true) {
  const it = await data.next();
  console.log(it.value);
  if (it.done) break;
}


