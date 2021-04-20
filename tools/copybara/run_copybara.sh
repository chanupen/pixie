#!/usr/bin/env bash

# Copyright 2018- The Pixie Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

git_committer_name='Copybara'
git_committer_email='copybara@pixielabs.ai'

workspace=$(bazel info workspace)

copybara_args="--ignore-noop --git-committer-name ${git_committer_name} \
                             --git-committer-email ${git_committer_email}"

pushd "${workspace}/tools/copybara/pxapi_go" || exit
copybara copy.bara.sky "${copybara_args}"
if [[ $retval -ne 0 && $retval -ne 4 ]]
then
    exit "$retval"
fi
popd || exit

pushd "${workspace}/tools/copybara/public" ||exit
copybara copy.bara.sky "${copybara_args}"
retval=$?
if [[ $retval -ne 0 && $retval -ne 4 ]]
then
    exit "$retval"
fi
popd || exit