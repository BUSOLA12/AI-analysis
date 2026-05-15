# Climate Risk Intelligence Dashboard — Prototype Explanation

## What We Built For You

Think of this as a **smart early-warning system for climate risks** — specifically built for communities in Abuja, Nigeria.

---

## The Big Picture

Imagine a **control room screen** that a city emergency manager or public health official has open on their computer. At any moment, they can see what the weather is doing, which communities are at risk, and get instant AI-powered advice on what to do. That's exactly what this prototype does.

---

## How It Works — Step by Step

### Step 1: The system wakes up and checks the weather
The moment you open the dashboard, it automatically goes out to a live weather service and pulls in the **current real weather conditions** for Abuja — things like temperature, humidity, wind speed, and rainfall. This happens every time the page loads, so the data is always fresh.

### Step 2: You see a live map of communities
The dashboard shows a **map of 8 communities** spread across the Abuja metropolitan area. Each community on the map is shown as a coloured dot:
- **Green** = low risk
- **Yellow** = medium risk
- **Orange** = high risk
- **Red** = critical risk

These colours are based on how vulnerable each community already is — for example, communities built on flood plains are naturally at higher risk than others.

### Step 3: You click on a community to learn more
When you click on any community's dot on the map, the system does something powerful — it **sends the current weather data plus that community's details to an AI**. The AI reads all of that information and, within seconds, gives back:
- A **risk score** from 0 to 100 (the higher the number, the worse the situation)
- The **main threat** right now (e.g., flooding, heat wave, high winds)
- Separate risk levels for **flood**, **heat**, and **wind**
- Up to **3 specific alerts** (e.g., "Heavy rainfall expected in next 6 hours")
- A clear **recommended action** (e.g., "Issue evacuation advisory for low-lying areas")
- A **72-hour outlook** summarising what's coming in the next 3 days

### Step 4: Alerts flow in real-time on the right side
On the right side of the screen, there's a **live alert feed** — like a news ticker but for climate risks. It shows a running log of system messages and AI-generated warnings. Officials can also hit a button to **broadcast an emergency message** to all communities at once.

### Step 5: Charts and forecasts are available
There's also a **Forecast tab** that shows visual charts — you can see how temperature, rainfall, and wind will change over the next 24 hours and 7 days. No guessing — it's visual and easy to read.

---

## What Makes This Special

| Feature | What it means for you |
|---|---|
| **Live weather data** | The system always uses today's real conditions, not guesses |
| **AI analysis** | Instead of a human doing manual calculations, an AI does the risk assessment in seconds |
| **Interactive map** | Decision-makers can visually see which areas need attention right now |
| **Real-time alerts** | No delay — risks are surfaced immediately |
| **Mobile-friendly** | Works on phones and tablets, not just desktop computers |

---

## What's Currently a Prototype (and What Can Be Expanded)

Right now, the **8 communities on the map are sample data** we put in to demonstrate the concept. In the real version, you could load in any number of real communities with their actual coordinates and demographic data.

The **AI analysis, the live weather, the map, the alerts — all of that is fully functional today.** You can click it, test it, and see real results.

---

## In Summary

This prototype is a working, live demonstration of a system that:
1. **Watches the weather** automatically
2. **Identifies which communities are at risk** based on real data
3. **Uses AI to explain the risks** in plain, actionable language
4. **Alerts decision-makers** so they can act fast

It's built so it can be deployed to the internet and accessed from anywhere — and it's ready to be connected to real community databases when you're ready to go to the next stage.
