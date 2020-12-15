/**
 * Inspired by https://github.com/google-github-actions/setup-gcloud
 */

import {
    addPath,
    debug,
    getInput,
} from '@actions/core';
import {
    cacheDir,
    downloadTool,
    find,
    findAllVersions,
} from '@actions/tool-cache';
import { retry } from '@lifeomic/attempt';


/**
 * Checks whether the kn tool is already installed.
 * @param {string} version 
 */
function isInstalled(version) {
    let toolPath;
    if (version) {
        toolPath = find('kn', version);
        return toolPath != undefined && toolPath !== '';
    } else {
        toolPath = findAllVersions('kn');
        return toolPath.length > 0;
    }
}

/**
 * Installs the downloaded kn tool.
 * @param {string} version The version being installed.
 * @param {*} downloadPath The download path for the tool.
 */
async function install(version, downloadPath) {
    const toolRoot = downloadPath;

    let toolPath = await cacheDir(toolRoot, 'kn', version);

    addPath(toolPath);
}

async function run() {
    const knVersion = getInput('version');

    if (knVersion.length < 1 || knVersion[0] !== 'v') {
        throw new Error(`Invalid kn version ${knVersion} specified. Must start with "v".`);
    }

    if (isInstalled(knVersion)) {
        debug(`kn ${knVersion} already installed. Skipping.`);
        return;
    }

    debug(`Downloading kn ${knVersion}.`);

    const url = `https://github.com/knative/client/releases/download/${knVersion}/kn-linux-amd64`;

    const downloadPath = await retry(async () => downloadTool(url), {
        delay: 200,
        factor: 2,
        maxAttempts: 4,
    });

    await install(knVersion, downloadPath);

    debug(`kn ${knVersion} installed.`);
}

run();
