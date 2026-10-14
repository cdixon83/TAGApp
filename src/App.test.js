import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

afterEach(() => {
  jest.useRealTimers();
});

function startListeriaDash() {
  fireEvent.click(screen.getByRole('button', { name: 'Listeria Dash' }));
  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
}

test('shows the game picker and launches Listeria Dash', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'Pick a TAG Game' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Listeria Dash' }));

  expect(screen.getByRole('heading', { name: 'Listeria Dash' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /all tag games/i }));
  expect(screen.getByRole('heading', { name: 'Pick a TAG Game' })).toBeInTheDocument();
});

test('starts with 15 Listeria and removes one when tapped without replacement', () => {
  render(<App />);

  startListeriaDash();
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

test('adds 15 Listeria every three seconds', () => {
  jest.useFakeTimers();
  render(<App />);

  startListeriaDash();
  act(() => {
    jest.advanceTimersByTime(6000);
  });

  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(45);
});

test('pauses for help at 50% and 75%, then removes half and stops growth on yes', () => {
  jest.useFakeTimers();
  render(<App />);

  startListeriaDash();
  act(() => {
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(3000);
  });

  expect(screen.getByRole('alertdialog', { name: 'Ask TAG for help' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(50);
  fireEvent.click(screen.getAllByRole('button', { name: /tap a listeria/i })[0]);
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(50);

  act(() => {
    jest.advanceTimersByTime(30_000);
  });
  expect(screen.getByRole('alertdialog', { name: 'Ask TAG for help' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(50);

  fireEvent.click(screen.getByRole('button', { name: 'No' }));
  act(() => {
    jest.advanceTimersByTime(6000);
  });

  expect(screen.getByRole('alertdialog', { name: 'Ask TAG for help' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(75);

  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

  expect(screen.queryByRole('alertdialog', { name: 'Ask TAG for help' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(38);

  act(() => {
    jest.advanceTimersByTime(6000);
  });
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(38);

  for (let count = 0; count < 38; count += 1) {
    fireEvent.click(screen.getAllByRole('button', { name: /tap a listeria/i })[0]);
  }
  expect(screen.getByRole('alertdialog', { name: /your plant is clean/i })).toBeInTheDocument();
  expect(screen.getByText("There's clean and then there's TAG clean")).toBeInTheDocument();
});

test('celebrates when all Listeria are removed from the board', () => {
  render(<App />);

  startListeriaDash();
  for (const listeria of screen.getAllByRole('button', { name: /tap a listeria/i })) {
    fireEvent.click(listeria);
  }

  expect(screen.getByRole('alertdialog', { name: /your plant is clean/i })).toBeInTheDocument();
  expect(screen.queryByText("There's clean and then there's TAG clean")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /hooray/i }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('continues adding 15 Listeria after declining both help prompts', () => {
  jest.useFakeTimers();
  render(<App />);

  startListeriaDash();
  act(() => {
    jest.advanceTimersByTime(9000);
  });
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(50);
  fireEvent.click(screen.getByRole('button', { name: 'No' }));

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  act(() => {
    jest.advanceTimersByTime(6000);
  });
  expect(screen.getByRole('alertdialog', { name: 'Ask TAG for help' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(75);

  fireEvent.click(screen.getByRole('button', { name: 'No' }));
  act(() => {
    jest.advanceTimersByTime(3000);
  });
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(90);
});

test('keeps Listeria visible with a Game Over overlay when time runs out', () => {
  jest.useFakeTimers();
  render(<App />);

  startListeriaDash();
  act(() => {
    jest.advanceTimersByTime(9000);
  });
  fireEvent.click(screen.getByRole('button', { name: 'No' }));
  act(() => {
    jest.advanceTimersByTime(6000);
  });
  fireEvent.click(screen.getByRole('button', { name: 'No' }));
  act(() => {
    jest.advanceTimersByTime(14_000);
  });
  expect(screen.getAllByRole('button', { name: /tap a listeria/i })).toHaveLength(100);

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByText(/time is up/i)).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Game OverYour plant has been shut down');
  expect(screen.getAllByRole('button', { name: 'Listeria' })).toHaveLength(100);
  expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /tap a listeria/i })).not.toBeInTheDocument();
});
