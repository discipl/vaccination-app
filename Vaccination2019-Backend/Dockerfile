ARG tag=develop
ARG registry=lldockerreg.azurecr.io
ARG image=vaccination-prebuild
ARG prebuildImageHash
FROM ${registry}/${image}:${prebuildImageHash}

ARG short
ARG branch
ARG test="false"

ENV SHORT=${short}
ENV BRANCH=${branch}

WORKDIR /app

COPY ./src ./src
COPY ./tests ./tests
RUN if [ "${test}" = "true" ]; then npm run test; fi \
    && rm -r tests \
    && rm -r src

COPY ./src/ ./

CMD ["node", "app.js"]
