import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

afterEach(() => {
  jest.useRealTimers();
});

test('starts with 15 Listeria and removes one when tapped without replacement', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
  expect(screen.getByText('Tap the Listeria to clean it up before your problem gets out of hand')).toBeInTheDocument();
  const board = screen.getByRole('group', { name: /10 by 10 Listeria game grid/i });
  expect(board.children).toHaveLength(100);
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(15);
  expect(screen.getByRole('group', { name: /listeria statistics/i })).toHaveTextContent('Listeria Detected');
  expect(screen.getByRole('group', { name: /listeria statistics/i })).toHaveTextContent('Listeria Contamination');
  expect(screen.getByRole('group', { name: /listeria statistics/i })).toHaveTextContent('15');
  expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: /tap a listeria/i })[0]);

  expect(screen.getByRole('group', { name: /listeria statistics/i })).toHaveTextContent('Listeria Detected1');
  expect(screen.getByRole('group', { name: /listeria statistics/i })).toHaveTextContent('Listeria Contamination14');
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(14);
});

test('doubles the remaining Listeria population every three seconds', () => {
  jest.useFakeTimers();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
  act(() => {
    jest.advanceTimersByTime(3000);
  });

  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(30);
});

test('asks for help at 95%, leaves one Listeria, and stops doubling on yes', () => {
  jest.useFakeTimers();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
  act(() => {
    jest.advanceTimersByTime(9000);
  });

  expect(screen.getByRole('alertdialog', { name: /ask tag for help/i })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(100);

  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

  expect(screen.queryByRole('alertdialog', { name: /ask tag for help/i })).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(1);

  act(() => {
    jest.advanceTimersByTime(6000);
  });
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: /tap a listeria/i }));
  expect(screen.getByRole('alertdialog', { name: /your plant is clean/i })).toBeInTheDocument();
  expect(screen.getByText("There's clean and then there's TAG clean")).toBeInTheDocument();
});

test('celebrates when all Listeria are removed from the board', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
  for (const listeria of screen.getAllByRole('button', { name: /tap a listeria/i })) {
    fireEvent.click(listeria);
  }

  expect(screen.getByRole('alertdialog', { name: /your plant is clean/i })).toBeInTheDocument();
  expect(screen.queryByText("There's clean and then there's TAG clean")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /hooray/i }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('dismisses the help prompt for the rest of the round on no', () => {
  jest.useFakeTimers();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
  act(() => {
    jest.advanceTimersByTime(9000);
  });
  fireEvent.click(screen.getByRole('button', { name: 'No' }));

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(3000);
  });
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('ends the game after 30 seconds and offers another round', () => {
  jest.useFakeTimers();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
  act(() => {
    jest.advanceTimersByTime(30_000);
  });

  expect(screen.getByText(/time is up/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /tap a listeria/i })).not.toBeInTheDocument();
});
