Feature: Result thresholds according to the international Skat order
  The final report must make the winning threshold and the bonus tiers visible in the browser.

  Background:
    Given a browser game is loaded
    And the result screen is prepared for the declarer "Du"

  Scenario: Zero eyes do not count as a win
    Given the declarer has 0 eyes and the defenders have 120 eyes
    When the result screen is shown
    Then the score label is "Alleinspieler 0 : 120 Gegner"
    And the result tier label is "Verloren"

  Scenario: Thirty eyes are Schneider according to the official rules
    Given the declarer has 30 eyes and the defenders have 90 eyes
    When the result screen is shown
    Then the score label is "Alleinspieler 30 : 90 Gegner"
    And the result tier label is "Schneider"

  Scenario: Ninety eyes are still not a Schwarz result
    Given the declarer has 90 eyes and the defenders have 30 eyes
    When the result screen is shown
    Then the score label is "Alleinspieler 90 : 30 Gegner"
    And the result tier label is "Schneider"

  Scenario: One hundred and twenty eyes are Schwarz
    Given the declarer has 120 eyes and the defenders have 0 eyes
    When the result screen is shown
    Then the score label is "Alleinspieler 120 : 0 Gegner"
    And the result tier label is "Schwarz"
