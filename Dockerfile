FROM 		--platform=$TARGETOS/$TARGETARCH debian:bullseye-slim

LABEL       author="Isaac A. && Kasper J." maintainer="isaac@isaacs.site"

ENV         DEBIAN_FRONTEND=noninteractive

EXPOSE 8080/TCP
EXPOSE 28015/TCP
EXPOSE 28015/UDP
EXPOSE 28016/TCP

RUN			dpkg --add-architecture i386 \
			&& apt update \
			&& apt upgrade -y \
			&& apt install -y lib32gcc-s1 lib32stdc++6 unzip curl iproute2 tzdata libgdiplus libsdl2-2.0-0:i386 \
			&& curl -sL https://deb.nodesource.com/setup_14.x | bash - \
			&& apt install -y nodejs \
			&& mkdir /node_modules \
			&& npm install --prefix / ws \
			&& useradd -d /home/container -m container 

RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && \
    apt-get install -y nodejs \
    build-essential && \
    node --version && \ 
    npm --version

WORKDIR /home/steam

RUN mkdir -p /home/steam/steamcmd/ && \
    curl http://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar -xz -C ./steamcmd/ && \
    echo quit | ./steamcmd/steamcmd.sh && \
    mkdir -p ./.steam/sdk32 && mkdir /configuration && mkdir /data && \
    ln -s /home/steam/steamcmd/linux32/steamclient.so /home/steam/.steam/sdk32/steamclient.so

USER 		container
ENV  		USER=container HOME=/home/container

WORKDIR 	/home/container

COPY 		./entrypoint.sh /entrypoint.sh
COPY 		./wrapper.js /wrapper.js

CMD			[ "/bin/bash" ]