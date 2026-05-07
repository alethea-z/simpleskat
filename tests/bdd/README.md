# BDD Test Vorgehen für SimpleSkat

## Ziel
Diese Suite beschreibt **Verhalten aus Sicht des Spiels** und nicht bloß einen Browser-Durchlauf.

Ein einzelner automatisierter Browserlauf ist nur dann BDD-tauglich, wenn er als **Verhaltensszenario** formuliert ist, also:
- mit fachlichen Begriffen der Skatordnung,
- mit klarer Vorbedingung,
- mit einem beobachtbaren Verhalten,
- mit einem fachlichen Ergebnis.

## Leitplanken
- **Ein Szenario = ein Verhalten.** Keine Mischszenarien mit vielen Regeln gleichzeitig.
- **Fachsprache vor UI-Sprache.** Keine Selektoren, Klickreihenfolgen oder DOM-Details in der Spezifikation.
- **Rule-Gruppen statt Monolith.** Große Regelbereiche werden in `Rule:`-Blöcke gegliedert.
- **Scenario Outline nur bei echten Varianten.** Zum Beispiel die offizielle Bietfolge oder die vier Farben.
- **Browser ist der Ausführer, nicht die Definition.** Die Spezifikation bleibt Gherkin; die Ausführung kann über Cucumber, Playwright oder eine eigene Brücke erfolgen.
- **Jede kritische Regel bekommt mindestens einen Negativfall.** Also nicht nur „was funktioniert“, sondern auch „was verboten ist“.

## Empfohlene Testpyramide
1. **Regel-/Domain-Tests** für reine Spielregeln und Punktelogik.
2. **BDD-/Gherkin-Szenarien** für fachliches Verhalten und Akzeptanz.
3. **Browser-Ausführung** nur dort, wo Nutzerverhalten sichtbar werden muss.

## Vorgehen
1. Die Skatordnung in fachliche Regelgruppen zerlegen.
2. Pro Regelgruppe 1:n Verhaltensszenarien schreiben.
3. Szenarien zuerst am Spielmodell validieren.
4. Nur die sichtbaren Kernpfade im Browser nachziehen.
5. Für jede neue Regel den Testkatalog erweitern, bevor der Code weiter wächst.

## Woran wir BDD hier messen
Ein Test ist gut, wenn ein Mensch die Spezifikation lesen und sagen kann:
- was das Spiel tun soll,
- unter welchen Bedingungen,
- und welches Ergebnis erwartet wird.

## Aktuelle Suite
- `01-dealing-and-bidding.feature`
- `02-contract-and-trumps.feature`
- `03-trick-play.feature`
- `04-scoring-and-result.feature`
- `05-privacy-and-usability.feature`

## Hinweis
Die nachfolgenden Feature-Dateien sind bewusst als **Verhaltensspezifikation** geschrieben. Sie sind noch nicht an einen konkreten Cucumber-Runner gebunden, aber so formuliert, dass sie direkt dorthin überführt werden können.