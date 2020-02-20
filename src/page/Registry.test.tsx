import React, { Suspense } from "react";
import { render, wait } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import Registry from "./Registry";
/* eslint-env jest */

test("hidden files for /x/abc/", async () => {
  const history = createMemoryHistory();
  history.push("/x/abc/");
  const { getByText, queryByText } = render(
    <Suspense fallback={<div>Loading...</div>}>
      <Router history={history}>
        <Registry />
      </Router>
    </Suspense>
  );
  await wait(() => expect(getByText("Abc")).toBeTruthy());
  expect(queryByText(".gitignore")).toBeFalsy();
  const hiddenFilesButton = getByText("SHOW 2 HIDDEN FILES");
  expect(hiddenFilesButton).toBeTruthy();
  hiddenFilesButton.click();
  await wait(() => expect(getByText(".gitignore")).toBeTruthy());
  expect(queryByText("SHOW 2 HIDDEN FILES")).toBeFalsy();
});
