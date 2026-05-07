Feature: Scoring, winner determination, and result presentation
  The result must be derived from the rule-correct point totals.

  Background:
    Given a full game has been played to completion
    And every card point is accounted for internally

  Rule: Eye accounting
    Scenario: The full deck always totals 120 eyes
      When the points of all cards are summed
      Then the total is 120 eyes

    Scenario: Trick points plus skat points still total 120 eyes
      Given some cards are in tricks
      And some cards are in the skat
      When all points are summed together
      Then the total is 120 eyes

  Rule: Win and loss thresholds
    Scenario: Declarer wins when reaching 61 eyes or more
      Given the declarer has 61 eyes
      When the result is calculated
      Then the declarer wins

    Scenario: Defenders win when the declarer stays at 60 eyes or fewer
      Given the declarer has 60 eyes
      When the result is calculated
      Then the defenders win

    Scenario: Schneider is reached at 90 eyes or more for the winning side
      Given one side has 90 eyes
      When the result summary is calculated
      Then Schneider is reported for that side

    Scenario: Schwarz is reached when one side takes all tricks
      Given one side has taken all ten tricks
      When the result summary is calculated
      Then Schwarz is reported for that side

  Rule: Automatic result presentation
    Scenario: The winner is shown automatically after the final trick
      Given the tenth trick has been resolved
      When the result phase opens
      Then the winner is shown without manual prompting
      And the final eyes are displayed

    Scenario: The result remains inspectable in the project log
      Given the game has finished
      When the run is recorded
      Then the phase log contains the final outcome
      And the next action is clear