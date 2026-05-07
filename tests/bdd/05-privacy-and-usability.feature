Feature: Privacy and mobile usability
  The game must stay usable on a phone and must not leak hidden information.

  Background:
    Given the app is opened on a mobile viewport
    And the current run is being observed by the human

  Rule: Hidden information stays hidden
    Scenario: The skat discard identities are not revealed before the discard is completed
      Given the skat phase has not been completed
      When the log is inspected
      Then no hidden discard identity is visible

    Scenario: Hidden cards are not exposed through the public result text
      Given the game is still in progress
      When the public status is rendered
      Then the hidden skat cards are not disclosed

  Rule: Mobile usability
    Scenario: The human hand remains readable on a narrow screen
      Given the viewport is smartphone-sized
      When the hand is displayed
      Then cards remain visible without horizontal overflow
      And the order stays deterministic

    Scenario: Legal action buttons remain usable on a mobile screen
      Given the play phase is active
      When the available actions are rendered
      Then the important actions are reachable on a narrow display
      And disabled actions are clearly disabled

  Rule: Inspectable process logging
    Scenario: The run log records phase, blocker, and next action
      Given a meaningful phase transition happened
      When the log is inspected
      Then the current phase is visible
      And any blocker is visible
      And the next action is visible

    Scenario: A completed feature records the verification outcome
      Given the feature slice has been verified
      When the handoff note is written
      Then the verification result is recorded
      And follow-up work remains explicit